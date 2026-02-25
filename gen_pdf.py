import pathlib, re
from fpdf import FPDF

md_path = r'C:\Users\ASUS\Desktop\guia_odontologo_prueba.md'
out_path = r'C:\Users\ASUS\Desktop\guia_odontologo_odonloop.pdf'

lines = pathlib.Path(md_path).read_text(encoding='utf-8').splitlines()

pdf = FPDF()
pdf.add_page()
pdf.set_margins(20, 20, 20)
pdf.set_auto_page_break(auto=True, margin=20)

# Fuentes TTF del sistema Windows (soportan Unicode completo)
ARIAL = r'C:\Windows\Fonts\arial.ttf'
ARIAL_B = r'C:\Windows\Fonts\arialbd.ttf'
ARIAL_I = r'C:\Windows\Fonts\ariali.ttf'

pdf.add_font('Arial', '', ARIAL)
pdf.add_font('Arial', 'B', ARIAL_B)
pdf.add_font('Arial', 'I', ARIAL_I)

def clean(text):
    """Limpia sintaxis Markdown dejando el texto plano con acentos intactos."""
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
    return text

w = pdf.w - 40  # ancho útil

i = 0
while i < len(lines):
    line = lines[i]

    # H1
    if line.startswith('# '):
        pdf.ln(4)
        pdf.set_font('Arial', 'B', 18)
        pdf.set_text_color(30, 58, 138)
        pdf.multi_cell(w, 10, clean(line[2:]))
        pdf.set_draw_color(30, 58, 138)
        pdf.set_line_width(0.5)
        pdf.line(20, pdf.get_y(), pdf.w - 20, pdf.get_y())
        pdf.ln(4)

    # H2
    elif line.startswith('## '):
        pdf.ln(6)
        pdf.set_font('Arial', 'B', 14)
        pdf.set_text_color(30, 58, 138)
        pdf.multi_cell(w, 9, clean(line[3:]))
        pdf.ln(2)

    # H3
    elif line.startswith('### '):
        pdf.ln(3)
        pdf.set_font('Arial', 'B', 12)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(w, 8, clean(line[4:]))
        pdf.ln(1)

    # HR
    elif line.startswith('---'):
        pdf.ln(3)
        pdf.set_draw_color(200, 200, 200)
        pdf.set_line_width(0.3)
        pdf.line(20, pdf.get_y(), pdf.w - 20, pdf.get_y())
        pdf.ln(3)

    # Blockquote
    elif line.startswith('> '):
        pdf.ln(2)
        pdf.set_fill_color(239, 246, 255)
        pdf.set_font('Arial', 'I', 10)
        pdf.set_text_color(30, 64, 175)
        pdf.set_left_margin(26)
        pdf.multi_cell(w - 6, 7, clean(line[2:]), fill=True)
        pdf.set_left_margin(20)
        pdf.ln(2)

    # Tabla
    elif line.startswith('| '):
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            stripped = lines[i].strip('|').replace('-', '').replace(' ', '').replace(':', '')
            if stripped == '':
                i += 1
                continue
            cells = [c.strip() for c in lines[i].strip('|').split('|')]
            rows.append(cells)
            i += 1
        if rows:
            ncols = len(rows[0])
            col_w = w / ncols
            # Header
            pdf.set_font('Arial', 'B', 10)
            pdf.set_fill_color(239, 246, 255)
            pdf.set_text_color(30, 58, 138)
            for cell in rows[0]:
                pdf.cell(col_w, 8, clean(cell), border=1, fill=True)
            pdf.ln()
            # Filas
            pdf.set_font('Arial', '', 10)
            pdf.set_text_color(34, 34, 34)
            for row in rows[1:]:
                for cell in row:
                    pdf.cell(col_w, 7, clean(cell), border=1)
                pdf.ln()
            pdf.ln(3)
        continue

    # Lista con viñeta
    elif line.startswith('- ') or line.startswith('* '):
        pdf.set_font('Arial', '', 11)
        pdf.set_text_color(34, 34, 34)
        content = clean(line[2:])
        pdf.set_x(24)
        # bullet unicode
        pdf.cell(5, 6, '\u2022')
        pdf.set_x(30)
        pdf.multi_cell(w - 10, 6, content)

    # Lista numerada
    elif re.match(r'^\d+\. ', line):
        pdf.set_font('Arial', '', 11)
        pdf.set_text_color(34, 34, 34)
        num, rest = line.split('. ', 1)
        pdf.set_x(24)
        pdf.cell(6, 6, f'{num}.')
        pdf.set_x(32)
        pdf.multi_cell(w - 12, 6, clean(rest))

    # Línea vacía
    elif line.strip() == '':
        pdf.ln(3)

    # Párrafo normal
    else:
        pdf.set_font('Arial', '', 11)
        pdf.set_text_color(34, 34, 34)
        pdf.multi_cell(w, 6, clean(line))

    i += 1

pdf.output(out_path)
print('PDF generado:', out_path)
