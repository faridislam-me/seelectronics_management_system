"use server";

import { db } from "@/db/drizzle";
import { pushToUser } from "@/lib/push";
import { smsLogs, staffNotifications, staffs, tasks } from "@/db/schema";
import { sendSMS, verifySession } from "@/lib";
import { TaskStatus } from "@/types";
import { formatDate, generateRandomId } from "@/utils";
import { StaffSMSPreferencesSchema, TaskSchema } from "@/validationSchemas";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { refreshStaffStats } from "./staffActions";

/**
 * Checks if current time is within working hours (9 AM - 9 PM)
 */
function isWithinWorkingHours() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 9 && hour < 21;
}

/**
 * Sends a concise SMS notification to staff about a new task
 */
async function sendTaskNotificationSMS(
  staffId: string,
  taskTitle: string,
  priority: string,
  dueDate?: Date | null,
) {
  try {
    const staff = await db.query.staffs.findFirst({
      where: eq(staffs.staffId, staffId),
    });

    if (!staff || staff.smsOptOut || !staff.smsNotificationEnabled) return;

    if (staff.smsWorkingHoursOnly && !isWithinWorkingHours()) {
      // Logic for daily digest could go here if smsFrequency is 'daily_digest'
      // For now, we skip or log for later.
      return;
    }

    const shortTitle =
      taskTitle.length > 30 ? taskTitle.substring(0, 27) + "..." : taskTitle;
    const formattedDate = dueDate ? formatDate(dueDate) : "N/A";

    // Minimal SMS content (< 160 chars)
    const smsContent = `New Task: ${shortTitle}\nPriority: ${priority.toUpperCase()}\nDue: ${formattedDate}\nLog in to your dashboard for details: ${process.env.NEXT_PUBLIC_APP_URL}/staff/tasks`;

    try {
      await sendSMS(staff.phone, smsContent);
      await db.insert(smsLogs).values({
        staffId,
        phoneNumber: staff.phone,
        message: smsContent,
        status: "sent",
      });
    } catch (error: any) {
      console.error("Failed to send task SMS:", error);
      await db.insert(smsLogs).values({
        staffId,
        phoneNumber: staff.phone,
        message: smsContent,
        status: "failed",
        error: error.message || "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error in sendTaskNotificationSMS:", error);
  }
}

/**
 * Create a new task and notify staff
 */
export async function createTask(data: any) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const validated = TaskSchema.parse(data);
    const taskId = generateRandomId();

    await db.insert(tasks).values({
      taskId,
      staffId: validated.staffId,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      dueDate: validated.dueDate,
      status: "pending",
      files: validated.files || [],
      comments: [],
    });

    // Notify staff via database notification
    await db.insert(staffNotifications).values({
      staffId: validated.staffId,
      type: "task_assigned",
      message: `You have been assigned a new task: ${validated.title}`,
      link: "/staff/tasks",
    });
    void pushToUser("staff", validated.staffId, { title: "নতুন টাস্ক", body: validated.title, link: "/staff/tasks" });

    // Trigger SMS notification
    await sendTaskNotificationSMS(
      validated.staffId,
      validated.title,
      validated.priority,
      validated.dueDate,
    );

    revalidatePath("/staff/tasks", "layout");

    return { success: true, message: "Task created and staff notified." };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, message: "Could not create task." };
  }
}

/**
 * Get tasks for a specific staff member
 */
export async function getStaffTasks() {
  try {
    const session = await verifySession(false); // Staff or admin
    if (!session || !session.userId)
      return { success: false, message: "Unauthorized" };

    // Find staffId from session userId (id)
    const staff = await db.query.staffs.findFirst({
      where: eq(staffs.staffId, session.userId as string),
    });

    if (!staff) return { success: false, message: "Staff not found." };

    const data = await db.query.tasks.findMany({
      where: eq(tasks.staffId, staff.staffId),
      orderBy: [desc(tasks.createdAt)],
      with: {
        staff: true,
        service: true,
      },
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching staff tasks:", error);
    return { success: false, message: "Could not fetch tasks." };
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  try {
    const session = await verifySession(false);
    if (!session) return { success: false, message: "Unauthorized" };

    await db.update(tasks).set({ status }).where(eq(tasks.taskId, taskId));

    // Synchronize with related service if it exists
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.taskId, taskId),
      columns: { serviceId: true },
    });

    if (task?.serviceId) {
      const { services, serviceStatusHistory } = await import("@/db/schema");

      if (status === "cancelled") {
        await db
          .update(services)
          .set({ status: "appointment_retry" })
          .where(eq(services.serviceId, task.serviceId));
        await db.insert(serviceStatusHistory).values({
          serviceId: task.serviceId,
          status: "appointment_retry",
          cancelReason:
            "Task cancelled by staff member. Service requires reappointment.",
          statusType: "system",
        });
      } else if (status === "completed") {
        await db
          .update(services)
          .set({ status: "completed", resolvedBy: "staff_member" })
          .where(eq(services.serviceId, task.serviceId));
        await db.insert(serviceStatusHistory).values({
          serviceId: task.serviceId,
          status: "completed",
          statusType: "system",
        });
      } else if (status === "in_progress") {
        await db
          .update(services)
          .set({ status: "in_progress" })
          .where(eq(services.serviceId, task.serviceId));
      }

      if (status !== "in_progress") {
        const service = await db.query.services.findFirst({
          where: eq(services.serviceId, task.serviceId),
          columns: { staffId: true },
        });
        try {
          await refreshStaffStats([service?.staffId]);
        } catch (err) {
          console.error("Failed to refresh staff stats:", err);
        }
      }
    }

    revalidatePath("/staff/tasks", "layout");

    return { success: true, message: "Task status updated." };
  } catch (error) {
    console.error("Error updating task status:", error);
    return { success: false, message: "Could not update task status." };
  }
}

/**
 * Update staff SMS preferences
 */
export async function updateStaffSMSPreferences(data: any) {
  try {
    const session = await verifySession(false);
    if (!session || !session.userId)
      return { success: false, message: "Unauthorized" };

    const validated = StaffSMSPreferencesSchema.parse(data);

    await db
      .update(staffs)
      .set(validated)
      .where(eq(staffs.staffId, session.userId as string));

    return { success: true, message: "Preferences updated." };
  } catch (error) {
    console.error("Error updating SMS preferences:", error);
    return { success: false, message: "Could not update preferences." };
  }
}

/**
 * Get task details
 */
export async function getTaskDetails(taskId: string) {
  try {
    const session = await verifySession(false);
    if (!session) return { success: false, message: "Unauthorized" };

    const data = await db.query.tasks.findFirst({
      where: eq(tasks.taskId, taskId),
    });

    if (!data) return { success: false, message: "Task not found." };

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching task details:", error);
    return { success: false, message: "Could not fetch task details." };
  }
}
