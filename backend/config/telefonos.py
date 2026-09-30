"""Teléfonos argentinos cargados a mano."""


def normalizar_telefono_ar(telefono):
    """
    Lleva un teléfono argentino al formato internacional de WhatsApp (549 + característica + número).
    Acepta '2262 15 512345', '+54 9 2262 512345', '011 4444-5555', etc. Devuelve None si no se puede
    interpretar con seguridad.
    """
    digitos = ''.join(c for c in (telefono or '') if c.isdigit())
    if not digitos:
        return None
    if digitos.startswith('549'):
        return digitos if len(digitos) == 13 else None
    if digitos.startswith('54'):
        digitos = digitos[2:]
    digitos = digitos.lstrip('0')
    if len(digitos) == 12:
        # Característica + 15 + número: sacar el 15 (probando características de 2, 3 y 4 dígitos)
        for largo in (2, 3, 4):
            if digitos[largo:largo + 2] == '15':
                digitos = digitos[:largo] + digitos[largo + 2:]
                break
    return f'549{digitos}' if len(digitos) == 10 else None
