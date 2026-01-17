"use client"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface GeneratePDFOptions {
    elementId: string
    filename: string
}

export async function generateCertificatePDF({ elementId, filename }: GeneratePDFOptions): Promise<boolean> {
    const element = document.getElementById(elementId)
    if (!element) {
        console.error("Element not found:", elementId)
        return false
    }

    try {
        // Get the actual dimensions of the element
        const rect = element.getBoundingClientRect()

        // Create high-quality canvas with optimal settings for PDF
        const canvas = await html2canvas(element, {
            // High resolution for crisp PDF
            scale: 4,

            // Use actual pixel dimensions
            width: rect.width,
            height: rect.height,

            // Ensure all images are loaded
            useCORS: true,
            allowTaint: false,

            // Force white background
            backgroundColor: "#ffffff",

            // Disable logging
            logging: false,

            // Remove any x/y offset
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,

            // Use better image rendering
            imageTimeout: 15000,

            // Ensure fonts are loaded
            onclone: (clonedDoc) => {
                // Wait for fonts to be ready in cloned document
                const clonedElement = clonedDoc.getElementById(elementId)
                if (clonedElement) {
                    // Force all elements to be visible and properly styled
                    clonedElement.style.transform = "none"
                    clonedElement.style.opacity = "1"

                    // Ensure consistent rendering
                    const allElements = clonedElement.querySelectorAll("*")
                    allElements.forEach((el) => {
                        const htmlEl = el as HTMLElement
                        // Remove any transitions or animations
                        htmlEl.style.transition = "none"
                        htmlEl.style.animation = "none"
                    })
                }
            },
        })

        // Create PDF with A4 portrait dimensions
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true,
        })

        // A4 dimensions in mm
        const pdfWidth = 210
        const pdfHeight = 297

        // Convert canvas to image data with maximum quality
        const imgData = canvas.toDataURL("image/png", 1.0)

        // Add image to PDF, filling the entire page
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST")

        // Save the PDF
        pdf.save(`${filename}.pdf`)

        return true
    } catch (error) {
        console.error("Failed to generate PDF:", error)
        return false
    }
}
