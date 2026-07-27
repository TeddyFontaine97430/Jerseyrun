"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClubForUser } from "@/lib/clubStats";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured } from "@/lib/stripe";

export async function connectStripeAccount() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLUB") return;

  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED" || !stripeConfigured) return;

  let accountId = club.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: club.email,
      capabilities: {
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.club.update({ where: { id: club.id }, data: { stripeAccountId: accountId } });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/club/dashboard/parametres?stripe=refresh`,
    return_url: `${baseUrl}/club/dashboard/parametres?stripe=return`,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}

export async function refreshStripeAccountStatus() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLUB") return;

  const club = await getClubForUser(session.user.id);
  if (!club || !club.stripeAccountId || !stripeConfigured) return;

  const account = await stripe.accounts.retrieve(club.stripeAccountId);
  await prisma.club.update({
    where: { id: club.id },
    data: { stripePayoutsEnabled: account.payouts_enabled ?? false },
  });
}
