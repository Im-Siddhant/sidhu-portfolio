import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(10).max(3000),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });

    const supabase = await createClient();
    const { name, email, message } = parsed.data;
    const { error } = await supabase.from('contact_messages').insert({ name, email, message, is_read: false });
    if (error) return NextResponse.json({ error: 'Unable to send your message right now.' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
