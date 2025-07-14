export const normalizeNumber = (phoneNumber: string): string => {
  // Primero, limpia el número de teléfono para que solo contenga dígitos y el signo `+`.
  const cleanedNumber = phoneNumber.replace(/[^0-9+]/g, '');

  // Si el número ya comienza con `+`, nos aseguramos de que sea el único `+` y lo devolvemos.
  if (cleanedNumber.startsWith('+')) {
    const digits = cleanedNumber.substring(1).replace(/\+/g, '');
    return `+${digits}`;
  }

  // Si no comienza con `+`, eliminamos cualquier `+` que pueda estar en otro lugar
  // y lo añadimos al principio.
  const digits = cleanedNumber.replace(/\+/g, '');
  return `+${digits}`;
}; 