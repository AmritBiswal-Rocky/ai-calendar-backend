// src/api/nagerDate.js
import axios from 'axios';

export async function fetchNagerHolidays(countryCode = 'IN', year = new Date().getFullYear()) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  const res = await axios.get(url);
  return res.data || [];
}
