/**
 * Resuelve el ID de usuario desde req.user (documento Mongoose o JWT payload).
 */
export function getUserId(user) {
  if (!user) return null;
  const id = user._id ?? user.id;
  if (id == null) return null;
  return typeof id === 'string' ? id : id.toString();
}
