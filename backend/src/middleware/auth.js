import jwt from 'jsonwebtoken';

export const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token de las cookies en lugar del header
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        error: 'No autorizado - No se encontró la sesión'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar la información del usuario decodificada a la request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(401).json({
      error: 'No autorizado - Sesión inválida'
    });
  }
}; 