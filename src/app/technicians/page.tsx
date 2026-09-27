import { getAllTeamMembers } from "@/actions/staffActions";
import Image from "next/image";
import Link from "next/link";

export default async function TechniciansPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const roleFilter = sp?.role as "technician" | "electrician" | undefined;
  const searchQuery = sp?.search as string | undefined;

  const response = await getAllTeamMembers();
  let staffs = response.success ? (response.data ?? []) : [];

  // Sort by rating (highest first) by default, but can be customized
  staffs = [...staffs].sort(
    (a, b) =>
      ((b as { rating?: number }).rating || 0) -
      ((a as { rating?: number }).rating || 0),
  );

  // Filter by role if specified
  if (roleFilter) {
    staffs = staffs.filter((staff: any) => staff.role === roleFilter);
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    staffs = staffs.filter(
      (staff: any) =>
        staff.name.toLowerCase().includes(query) ||
        staff.phone.includes(query) ||
        (staff.skills &&
          JSON.parse(staff.skills || "[]").some((s: string) =>
            s.toLowerCase().includes(query),
          )),
    );
  }

  const title =
    roleFilter === "technician"
      ? "Technicians"
      : roleFilter === "electrician"
        ? "Electricians"
        : "Our Team";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{title}</h1>
          <p className="text-gray-600 text-lg">
            Find the right expert for your service needs
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <form method="get" className="flex gap-2">
              <input
                type="text"
                name="search"
                defaultValue={searchQuery || ""}
                placeholder="Search by name, phone, or skills..."
                className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input type="hidden" name="role" value={roleFilter || ""} />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Search
              </button>
            </form>
          </div>
          <div className="flex gap-2">
            <Link
              href="/technicians"
              className={`px-4 py-2 rounded-md ${!roleFilter ? "bg-blue-600 text-white" : "bg-white border"}`}
            >
              All
            </Link>
            <Link
              href="/technicians?role=technician"
              className={`px-4 py-2 rounded-md ${roleFilter === "technician" ? "bg-blue-600 text-white" : "bg-white border"}`}
            >
              Technicians
            </Link>
            <Link
              href="/technicians?role=electrician"
              className={`px-4 py-2 rounded-md ${roleFilter === "electrician" ? "bg-blue-600 text-white" : "bg-white border"}`}
            >
              Electricians
            </Link>
          </div>
        </div>

        {/* Staff Grid */}
        {staffs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No staff members found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {staffs.map((staff: any) => (
              <div
                key={staff.staffId}
                className="bg-white rounded-md shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                  {staff.photoUrl && (
                    <Image
                      src={staff.photoUrl}
                      alt={staff.name}
                      fill
                      className="object-contain object-bottom"
                    />
                  )}
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold capitalize">
                    {staff.role}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{staff.name}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-yellow-500">
                      {"★".repeat(Math.floor(staff.rating || 0))}
                      {"☆".repeat(5 - Math.floor(staff.rating || 0))}
                    </span>
                    <span className="text-gray-600 text-sm">
                      ({staff.rating || 0} rating)
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">
                    <strong>Phone:</strong> {staff.phone}
                  </p>
                  <p className="text-gray-600 mb-1">
                    <strong>Location:</strong> {staff.currentDistrict}
                  </p>
                  <p className="text-gray-600 mb-2">
                    <strong>Experience:</strong>{" "}
                    {(staff.hasRepairExperience &&
                      staff.repairExperienceYears) ||
                      staff.installationExperienceYears ||
                      0}{" "}
                    years
                  </p>
                  {staff.skills && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const skills =
                              typeof staff.skills === "string"
                                ? JSON.parse(staff.skills)
                                : staff.skills;
                            return skills
                              .slice(0, 3)
                              .map((skill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm"
                                >
                                  {skill}
                                </span>
                              ));
                          } catch {
                            return (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                                General
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Link
                      href={`/get-service?staffId=${staff.staffId}`}
                      className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Request This Technician
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Need help? Contact us at{" "}
            <a href="tel:+8801310673600" className="text-blue-600">
              +8801310673600
            </a>{" "}
            or{" "}
            <a href="mailto:seipsbd@gmail.com" className="text-blue-600">
              seipsbd@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
