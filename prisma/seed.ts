// =============================================================================
// Database Seed Script
//
// Creates a default admin user and realistic sample data.
// Run: npx prisma db seed
// =============================================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Admin user (PIN: 123456) ---
  const adminPinHash = await bcrypt.hash("123456", 12);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      pinHash: adminPinHash,
      displayName: "Admin User",
      isActive: true,
    },
  });

  console.log(`Created admin user: ${admin.username} (PIN: 123456)`);

  // --- Sample companies ---
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: "Acme Corporation",
        website: "https://acme.example.com",
        industry: "Manufacturing",
        headcount: 250,
        annualRevenue: 15000000,
        city: "Chicago",
        region: "Illinois",
        country: "United States",
        notes: "Long-standing account. Primary contact is the VP of Operations.",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.company.create({
      data: {
        name: "Bright Solar Ltd",
        website: "https://brightsolar.example.com",
        industry: "Renewable Energy",
        headcount: 80,
        annualRevenue: 5200000,
        city: "Austin",
        region: "Texas",
        country: "United States",
        notes: "Growing fast. Interested in enterprise plan.",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.company.create({
      data: {
        name: "CloudNine Software",
        website: "https://cloudnine.example.com",
        industry: "Technology",
        headcount: 500,
        annualRevenue: 42000000,
        city: "London",
        region: "England",
        country: "United Kingdom",
        notes: "Enterprise prospect. Decision expected Q2.",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.company.create({
      data: {
        name: "Delta Logistics",
        industry: "Transportation",
        headcount: 120,
        city: "Rotterdam",
        country: "Netherlands",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.company.create({
      data: {
        name: "Evergreen Health",
        website: "https://evergreenhealth.example.com",
        industry: "Healthcare",
        headcount: 40,
        annualRevenue: 3000000,
        city: "Toronto",
        region: "Ontario",
        country: "Canada",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
  ]);

  console.log(`Created ${companies.length} companies`);

  // --- Sample contacts ---
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        companyId: companies[0].id,
        firstName: "Sarah",
        lastName: "Mitchell",
        title: "VP of Operations",
        email: "s.mitchell@acme.example.com",
        phone: "+1-312-555-0101",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[0].id,
        firstName: "James",
        lastName: "Chen",
        title: "Procurement Manager",
        email: "j.chen@acme.example.com",
        phone: "+1-312-555-0102",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[1].id,
        firstName: "Maria",
        lastName: "Santos",
        title: "CEO",
        email: "maria@brightsolar.example.com",
        phone: "+1-512-555-0201",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[2].id,
        firstName: "Oliver",
        lastName: "Webb",
        title: "CTO",
        email: "o.webb@cloudnine.example.com",
        phone: "+44-20-7946-0301",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[2].id,
        firstName: "Priya",
        lastName: "Sharma",
        title: "Head of Procurement",
        email: "p.sharma@cloudnine.example.com",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[3].id,
        firstName: "Lars",
        lastName: "de Groot",
        title: "Operations Director",
        email: "lars@deltalogistics.example.com",
        phone: "+31-10-555-0401",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[4].id,
        firstName: "Emily",
        lastName: "Tremblay",
        title: "Office Manager",
        email: "emily@evergreenhealth.example.com",
        phone: "+1-416-555-0501",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
  ]);

  console.log(`Created ${contacts.length} contacts`);

  // --- Sample opportunities ---
  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        companyId: companies[0].id,
        type: "Equipment Supply",
        funnelStage: "Negotiation",
        status: "Open",
        value: 125000,
        rep: "Alex Rivera",
        notes: "Final pricing review scheduled for next week.",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        companyId: companies[0].id,
        type: "Service Contract",
        funnelStage: "Closed",
        status: "Won",
        value: 48000,
        rep: "Alex Rivera",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        companyId: companies[1].id,
        type: "Enterprise License",
        funnelStage: "Proposal",
        status: "Open",
        value: 72000,
        rep: "Jordan Lee",
        notes: "Sent proposal on Monday. Follow up Friday.",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        companyId: companies[2].id,
        type: "Platform Migration",
        funnelStage: "Discovery",
        status: "Open",
        value: 340000,
        rep: "Alex Rivera",
        notes: "Large deal. Multiple stakeholders involved.",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        companyId: companies[3].id,
        type: "Consulting",
        funnelStage: "Lead",
        status: "Open",
        value: 15000,
        rep: "Jordan Lee",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        companyId: companies[4].id,
        type: "SaaS Subscription",
        funnelStage: "Demo",
        status: "Open",
        value: 24000,
        rep: "Jordan Lee",
        notes: "Demo went well. Awaiting budget approval.",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
  ]);

  console.log(`Created ${opportunities.length} opportunities`);
  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
