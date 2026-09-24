import "dotenv/config";
import { faker } from "@faker-js/faker";
import { db } from "@/lib/db";
import { PRIORITY_RANK } from "@/lib/services/service-request-status";

const DEFAULT_PASSWORD = "Password123!";
const REQUEST_COUNT = 12_000;
const INSERT_BATCH_SIZE = 500;

const roles = [
  { name: "admin" },
  { name: "manager" },
  { name: "office" },
  { name: "requester" },
] as const;

const users = [
  {
    name: "System Admin",
    email: "admin@assunnah.local",
    role: "admin",
  },
  {
    name: "Office Manager",
    email: "office.manager@assunnah.local",
    role: "manager",
  },
  {
    name: "Education Manager",
    email: "manager.education@assunnah.local",
    role: "manager",
  },
  {
    name: "Healthcare Manager",
    email: "manager.healthcare@assunnah.local",
    role: "manager",
  },
  {
    name: "Relief Manager",
    email: "manager.relief@assunnah.local",
    role: "manager",
  },
  {
    name: "WASH Manager",
    email: "manager.wash@assunnah.local",
    role: "manager",
  },
  {
    name: "Livelihood Manager",
    email: "manager.livelihood@assunnah.local",
    role: "manager",
  },
  {
    name: "Dawah Manager",
    email: "manager.dawah@assunnah.local",
    role: "manager",
  },
  {
    name: "Environment Manager",
    email: "manager.environment@assunnah.local",
    role: "manager",
  },
  {
    name: "Internal Support Manager",
    email: "manager.support@assunnah.local",
    role: "manager",
  },
  {
    name: "Office Staff One",
    email: "office.one@assunnah.local",
    role: "office",
  },
  {
    name: "Office Staff Two",
    email: "office.two@assunnah.local",
    role: "office",
  },
  {
    name: "Office Staff Three",
    email: "office.three@assunnah.local",
    role: "office",
  },
  {
    name: "Requester One",
    email: "requester.one@assunnah.local",
    role: "requester",
  },
  {
    name: "Requester Two",
    email: "requester.two@assunnah.local",
    role: "requester",
  },
  {
    name: "Requester Three",
    email: "requester.three@assunnah.local",
    role: "requester",
  },
  {
    name: "Requester Four",
    email: "requester.four@assunnah.local",
    role: "requester",
  },
  {
    name: "Requester Five",
    email: "requester.five@assunnah.local",
    role: "requester",
  },
  {
    name: "Requester Six",
    email: "requester.six@assunnah.local",
    role: "requester",
  },
] as const;

const CATEGORIES = [
  "education",
  "skill_development",
  "healthcare",
  "emergency_relief",
  "food",
  "winter",
  "wash",
  "shelter",
  "livelihood",
  "dawah",
  "environment",
  "internal_support",
] as const;

type ServiceCategory = (typeof CATEGORIES)[number];

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
type Priority = (typeof PRIORITIES)[number];

type Status = "open" | "in_progress" | "resolved" | "closed";

/** Category keys match the portal labels. Names stay inside that category. */
const SERVICE_NAMES: Record<ServiceCategory, string[]> = {
  education: [
    "Student scholarship",
    "Madrasah enrollment",
    "School supply kit",
    "Quran class support",
    "Teacher training grant",
  ],
  skill_development: [
    "IT skills course",
    "English language program",
    "Vocational sewing class",
    "Digital literacy workshop",
  ],
  healthcare: [
    "Mobile medical camp",
    "Medicine distribution",
    "Maternal health visit",
    "Eye checkup camp",
  ],
  emergency_relief: [
    "Flood relief pack",
    "Emergency cash support",
    "Disaster shelter kit",
    "Cyclone response pack",
  ],
  food: [
    "Ramadan food basket",
    "Monthly ration pack",
    "Orphan family meal support",
    "Community iftar distribution",
  ],
  winter: [
    "Winter clothing kit",
    "Blanket distribution",
    "Warm clothing for children",
  ],
  wash: [
    "Tube well installation",
    "Latrine construction",
    "Hygiene kit distribution",
    "Safe water point repair",
  ],
  shelter: [
    "Flood-resilient shelter",
    "Home repair grant",
    "Temporary housing support",
  ],
  livelihood: [
    "Livelihood tool grant",
    "Small business seed fund",
    "Livestock support",
    "Tailoring equipment grant",
  ],
  dawah: [
    "Outreach education support",
    "Islamic education materials",
    "Community study circle",
  ],
  environment: [
    "Community tree plantation",
    "Waste cleanup drive",
    "School garden support",
  ],
  internal_support: [
    "Internal IT support",
    "Office equipment request",
    "Staff transport request",
  ],
};

const CATEGORY_MANAGER_EMAIL: Record<ServiceCategory, string> = {
  education: "manager.education@assunnah.local",
  skill_development: "office.three@assunnah.local",
  healthcare: "manager.healthcare@assunnah.local",
  emergency_relief: "manager.relief@assunnah.local",
  food: "office.one@assunnah.local",
  winter: "manager.relief@assunnah.local",
  wash: "manager.wash@assunnah.local",
  shelter: "manager.relief@assunnah.local",
  livelihood: "manager.livelihood@assunnah.local",
  dawah: "manager.dawah@assunnah.local",
  environment: "manager.environment@assunnah.local",
  internal_support: "manager.support@assunnah.local",
};

const AREAS = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Cox's Bazar",
  "Gazipur",
  "Narayanganj",
  "Cumilla",
  "Bogura",
  "Jashore",
];

const NOW = new Date("2026-09-24T06:00:00.000Z");
const EARLIEST_REQUEST = new Date("2025-06-01T00:00:00.000Z");

type SeededUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type SeededService = {
  id: number;
  name: string;
  slug: string;
  category: ServiceCategory;
};

type ActivityDraft = {
  action: string;
  actorId: number;
  fromValue: string | null;
  toValue: string | null;
  note: string;
  createdAt: Date;
};

type RequestDraft = {
  publicId: string;
  subject: string;
  description: string;
  requesterId: number;
  serviceId: number;
  category: ServiceCategory;
  priority: Priority;
  status: Status;
  assigneeId: number | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  activities: ActivityDraft[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function weightedPick<T extends string>(
  items: ReadonlyArray<{ weight: number; value: T }>,
) {
  return faker.helpers.weightedArrayElement([...items]);
}

function advance(cursor: Date, minutes: number) {
  const next = new Date(cursor.getTime() + minutes * 60_000);
  if (next.getTime() <= NOW.getTime()) {
    return next;
  }

  return new Date(cursor.getTime() + 1000);
}

function buildServices() {
  const services: Array<{
    name: string;
    slug: string;
    description: string;
    category: ServiceCategory;
    isActive: boolean;
  }> = [];
  const usedSlugs = new Set<string>();

  for (const category of CATEGORIES) {
    const names = faker.helpers.shuffle([...SERVICE_NAMES[category]]);

    for (const name of names) {
      let slug = slugify(name);
      if (usedSlugs.has(slug)) {
        slug = `${slug}-${category}`;
      }
      usedSlugs.add(slug);

      services.push({
        name,
        slug,
        description: faker.lorem.sentence({ min: 8, max: 16 }),
        category,
        isActive: faker.datatype.boolean({ probability: 0.92 }),
      });
    }
  }

  return services;
}

function buildSubject(serviceName: string) {
  const area = faker.helpers.arrayElement(AREAS);
  const family = faker.person.lastName();
  const count = faker.number.int({ min: 1, max: 40 });
  const subject = faker.helpers.arrayElement([
    `${serviceName} for ${family} family`,
    `${serviceName} request in ${area}`,
    `${count} families need ${serviceName.toLowerCase()}`,
    `${serviceName} support for ${area}`,
    `Urgent ${serviceName.toLowerCase()} in ${area}`,
  ]);

  return subject.slice(0, 255);
}

function buildActivities(input: {
  requesterId: number;
  assignee: SeededUser | null;
  actorId: number;
  status: Status;
  priority: Priority;
  createdAt: Date;
  serviceName: string;
}) {
  const activities: ActivityDraft[] = [];
  let cursor = input.createdAt;

  const push = (
    partial: Omit<ActivityDraft, "createdAt">,
    minutesLater: number,
  ) => {
    cursor = advance(cursor, minutesLater);
    activities.push({ ...partial, createdAt: cursor });
  };

  push(
    {
      action: "created",
      actorId: input.requesterId,
      fromValue: null,
      toValue: "open",
      note: faker.helpers.arrayElement([
        `${input.serviceName} request submitted.`,
        "Service request submitted.",
        "Request opened for staff review.",
      ]),
    },
    0,
  );

  if (faker.datatype.boolean({ probability: 0.12 })) {
    const previous = faker.helpers.arrayElement(
      PRIORITIES.filter((item) => item !== input.priority),
    );
    push(
      {
        action: "priority_changed",
        actorId: input.actorId,
        fromValue: previous,
        toValue: input.priority,
        note: `Priority moved to ${input.priority}.`,
      },
      faker.number.int({ min: 20, max: 360 }),
    );
  }

  if (input.assignee) {
    push(
      {
        action: "assigned",
        actorId: input.actorId,
        fromValue: null,
        toValue: String(input.assignee.id),
        note: `Assigned to ${input.assignee.name}.`,
      },
      faker.number.int({ min: 10, max: 240 }),
    );
  }

  const path: Status[] =
    input.status === "open"
      ? []
      : input.status === "in_progress"
        ? ["in_progress"]
        : input.status === "resolved"
          ? ["in_progress", "resolved"]
          : ["in_progress", "resolved", "closed"];

  let fromStatus: Status = "open";
  for (const toStatus of path) {
    push(
      {
        action: "status_changed",
        actorId: input.assignee?.id ?? input.actorId,
        fromValue: fromStatus,
        toValue: toStatus,
        note: faker.helpers.arrayElement([
          `Status moved to ${toStatus.replaceAll("_", " ")}.`,
          `${input.serviceName} marked ${toStatus.replaceAll("_", " ")}.`,
        ]),
      },
      faker.number.int({ min: 45, max: 60 * 36 }),
    );
    fromStatus = toStatus;
  }

  const resolvedAt =
    input.status === "resolved" || input.status === "closed" ? cursor : null;

  return {
    activities,
    resolvedAt,
    updatedAt: cursor,
  };
}

function buildRequests(input: {
  services: SeededService[];
  requesters: SeededUser[];
  staffByEmail: Map<string, SeededUser>;
  staff: SeededUser[];
}) {
  const requests: RequestDraft[] = [];

  for (let sequence = 1; sequence <= REQUEST_COUNT; sequence += 1) {
    const service = faker.helpers.arrayElement(input.services);
    const requester = faker.helpers.arrayElement(input.requesters);
    const priority = weightedPick([
      { weight: 20, value: "low" },
      { weight: 40, value: "medium" },
      { weight: 28, value: "high" },
      { weight: 12, value: "urgent" },
    ] as const);
    const status = weightedPick([
      { weight: 34, value: "open" },
      { weight: 30, value: "in_progress" },
      { weight: 22, value: "resolved" },
      { weight: 14, value: "closed" },
    ] as const);

    const categoryManager = input.staffByEmail.get(
      CATEGORY_MANAGER_EMAIL[service.category],
    );
    const assigneePool = [
      categoryManager,
      ...input.staff.filter((user) => user.role === "office"),
    ].filter((user): user is SeededUser => Boolean(user));

    const leaveUnassigned =
      status === "open" && faker.datatype.boolean({ probability: 0.28 });
    const assignee = leaveUnassigned
      ? null
      : faker.helpers.arrayElement(assigneePool);

    const actor =
      categoryManager ??
      assignee ??
      faker.helpers.arrayElement(input.staff);

    const createdAt = faker.date.between({
      from: EARLIEST_REQUEST,
      to: new Date("2026-09-20T00:00:00.000Z"),
    });

    const timeline = buildActivities({
      requesterId: requester.id,
      assignee,
      actorId: actor.id,
      status,
      priority,
      createdAt,
      serviceName: service.name,
    });

    requests.push({
      publicId: `SR-2026-${String(sequence).padStart(5, "0")}`,
      subject: buildSubject(service.name),
      description: faker.lorem.paragraph({ min: 1, max: 3 }),
      requesterId: requester.id,
      serviceId: service.id,
      category: service.category,
      priority,
      status,
      assigneeId: assignee?.id ?? null,
      createdAt,
      updatedAt: timeline.updatedAt,
      resolvedAt: timeline.resolvedAt,
      activities: timeline.activities,
    });
  }

  return requests;
}

async function insertInBatches<T>(
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>,
  label: string,
) {
  for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + INSERT_BATCH_SIZE);
    await insert(batch);
    const done = Math.min(index + batch.length, rows.length);
    console.log(`Inserted ${done}/${rows.length} ${label}.`);
  }
}

async function main() {
  faker.seed(12_000);

  const roleByName = new Map<string, number>();

  for (const role of roles) {
    const saved = await db.role.upsert({
      where: { name: role.name },
      create: { name: role.name },
      update: {},
    });
    roleByName.set(saved.name, saved.id);
  }

  const seededUsers: SeededUser[] = [];
  let adminUserId: number | null = null;

  for (const user of users) {
    const roleId = roleByName.get(user.role);
    if (!roleId) {
      throw new Error(`Unknown role "${user.role}" for ${user.email}`);
    }

    const saved = await db.user.upsert({
      where: { email: user.email },
      create: {
        name: user.name,
        email: user.email,
        passwordHash: DEFAULT_PASSWORD,
        roleId,
      },
      update: {
        name: user.name,
        passwordHash: DEFAULT_PASSWORD,
        roleId,
      },
    });

    seededUsers.push({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: user.role,
    });

    if (user.role === "admin") {
      adminUserId = saved.id;
    }
  }

  if (!adminUserId) {
    throw new Error("Admin user is required to seed services.");
  }

  const serviceDrafts = buildServices();
  const requesters = seededUsers.filter((user) => user.role === "requester");
  const staff = seededUsers.filter((user) => user.role !== "requester");
  const staffByEmail = new Map(staff.map((user) => [user.email, user]));

  console.log("Clearing previous services, requests, and activities...");
  await db.serviceActivity.deleteMany();
  await db.serviceRequest.deleteMany();
  await db.service.deleteMany();

  await insertInBatches(
    serviceDrafts.map((service) => ({
      ...service,
      createdById: adminUserId,
    })),
    (batch) => db.service.createMany({ data: batch }),
    "services",
  );

  const savedServices = await db.service.findMany({
    select: { id: true, name: true, slug: true, category: true },
  });

  const services: SeededService[] = savedServices.map((service) => {
    if (!CATEGORIES.includes(service.category as ServiceCategory)) {
      throw new Error(`Seeded service has unknown category ${service.category}`);
    }

    return {
      id: service.id,
      name: service.name,
      slug: service.slug,
      category: service.category as ServiceCategory,
    };
  });

  if (services.length !== serviceDrafts.length) {
    throw new Error("Seeded service count does not match the services array.");
  }

  console.log(`Building ${REQUEST_COUNT} service requests...`);
  const requests = buildRequests({
    services,
    requesters,
    staffByEmail,
    staff,
  });

  const mismatched = requests.filter(
    (request) =>
      !services.some(
        (service) =>
          service.id === request.serviceId &&
          service.category === request.category,
      ),
  );
  if (mismatched.length > 0) {
    throw new Error(
      `${mismatched.length} requests do not match a seeded service.`,
    );
  }

  await insertInBatches(
    requests.map((request) => ({
      publicId: request.publicId,
      subject: request.subject,
      description: request.description,
      requesterId: request.requesterId,
      serviceId: request.serviceId,
      category: request.category,
      priority: request.priority,
      priorityRank: PRIORITY_RANK[request.priority],
      status: request.status,
      assigneeId: request.assigneeId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      resolvedAt: request.resolvedAt,
    })),
    (batch) => db.serviceRequest.createMany({ data: batch }),
    "service requests",
  );

  const savedRequests = await db.serviceRequest.findMany({
    select: { id: true, publicId: true },
  });
  const requestIdByPublicId = new Map(
    savedRequests.map((request) => [request.publicId, request.id]),
  );

  const activities = requests.flatMap((request) => {
    const requestId = requestIdByPublicId.get(request.publicId);
    if (!requestId) {
      throw new Error(`Missing request ${request.publicId}`);
    }

    return request.activities.map((activity) => ({
      requestId,
      actorId: activity.actorId,
      action: activity.action,
      fromValue: activity.fromValue,
      toValue: activity.toValue,
      note: activity.note,
      createdAt: activity.createdAt,
    }));
  });

  await insertInBatches(
    activities,
    (batch) => db.serviceActivity.createMany({ data: batch }),
    "service activities",
  );

  console.log(
    `Seeded ${roles.length} roles: ${roles.map((role) => role.name).join(", ")}.`,
  );
  console.log(`Seeded ${users.length} users.`);
  console.log(`Seeded ${services.length} services.`);
  console.log(`Seeded ${requests.length} service requests.`);
  console.log(`Seeded ${activities.length} service activities.`);
  console.log(`Default password for all seeded users: ${DEFAULT_PASSWORD}`);
  console.log("User roles: 1 admin, 8 managers, 3 office, 6 requester.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
