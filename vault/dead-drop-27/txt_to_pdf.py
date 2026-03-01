import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

def create_pdf(txt_path, pdf_path, title):
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        alignment=TA_CENTER,
        fontName='Courier-Bold',
        fontSize=16,
        spaceAfter=20
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=10,
        leading=14,
        spaceAfter=10
    )

    Story = []
    
    # Add title
    Story.append(Paragraph("=== CONFIDENTIAL: THE GROVE INCIDENT ===", title_style))
    Story.append(Spacer(1, 12))

    try:
        with open(txt_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    Story.append(Spacer(1, 12))
                else:
                    # Replace basic markdown bold if any
                    line = line.replace('**', '')
                    Story.append(Paragraph(line, body_style))
                    
        doc.build(Story)
        print(f"Generated {pdf_path}")
    except Exception as e:
        print(f"Error generating {pdf_path}: {e}")

if __name__ == "__main__":
    files_to_convert = {
        "auth-vuln-P0-jira.txt": "auth-vuln-P0-jira.pdf",
        "cease-desist-draft.txt": "cease-desist-draft.pdf",
        "inboard-notes-v-edit.txt": "inboard-notes-v-edit.pdf"
    }

    print("Generating PDFs from enriched text files...")
    
    for txt_file, pdf_file in files_to_convert.items():
        if os.path.exists(txt_file):
            create_pdf(txt_file, pdf_file, txt_file.replace('.txt', '').replace('-', ' ').upper())
        else:
            print(f"File not found: {txt_file}")
