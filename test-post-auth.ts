import axios from 'axios';
import { db } from './src/db/client';
import { administrateurs } from './src/db/schema';
import { eq } from 'drizzle-orm';
import * as jwt from 'jose';

async function run() {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret_temporaire_pour_dev');
    const token = await new jwt.SignJWT({ id: 1, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1d')
      .sign(secret);
      
    const res = await axios.post('http://127.0.0.1:3001/api/v1/admin/pages/home', {
      key: 'test',
      value: 'test_value'
    }, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('SUCCESS:', res.status, res.data);
  } catch (e: any) {
    console.error('ERROR:', e.response?.status, e.response?.data);
  }
}
run();
