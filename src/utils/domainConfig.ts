export const getDomain = (email: string): string => {
  if (email === 'ai@mobiloitte.com') return 'mobiloitte';
  if (email === 'ai@user.com') return 'user';
  if (email === 'singhtushar1970@gmail.com') return 'carbon';
  return 'domain_1';
};

export const getBaseUrl = (): string => {
  return 'https://carbon-footprint-backend-ktp9.onrender.com';
};
