-- Deja solo roles requeridos para pruebas de flujo:
-- ADMINISTRADOR, BODEGA, COMPRAS, COMERCIAL.

DELETE FROM usuarios_roles
WHERE rol_id IN (
  SELECT id FROM roles WHERE nombre NOT IN ('ADMINISTRADOR', 'BODEGA', 'COMPRAS', 'COMERCIAL')
);

DELETE FROM roles
WHERE nombre NOT IN ('ADMINISTRADOR', 'BODEGA', 'COMPRAS', 'COMERCIAL');

ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_nombre_check;

ALTER TABLE roles
ADD CONSTRAINT roles_nombre_check
CHECK (nombre IN (
  'ADMINISTRADOR',
  'BODEGA',
  'COMPRAS',
  'COMERCIAL'
));

INSERT INTO roles (nombre) VALUES
('ADMINISTRADOR'),
('BODEGA'),
('COMPRAS'),
('COMERCIAL')
ON CONFLICT (nombre) DO NOTHING;
