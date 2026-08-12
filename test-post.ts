import axios from 'axios';

async function run() {
  try {
    const res = await axios.post('http://127.0.0.1:3001/api/v1/admin/pages/home', {
      key: 'test',
      value: 'test_value'
    }, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('SUCCESS:', res.status, res.data);
  } catch (e: any) {
    console.error('ERROR:', e.response?.status, e.response?.data);
  }
}
run();
