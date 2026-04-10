import { auth } from '@clerk/nextjs/server';
import { getGarageByClerkUserId } from '../../../../lib/api';

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ garageId: null }, { status: 401 });
  }

  const garage = await getGarageByClerkUserId(userId);
  return Response.json({ garageId: garage?.id ?? null });
}
