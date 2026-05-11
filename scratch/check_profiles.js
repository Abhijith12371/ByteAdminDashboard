import { supabase } from '../src/lib/supabase.js';

async function checkTable() {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.error('Error or Table does not exist:', error.message);
    } else {
      console.log('Table exists, data:', data);
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkTable();
