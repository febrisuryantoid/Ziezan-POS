
import { Transaction, AppSettings } from '../types';
import html2canvas from 'html2canvas';

// Cache for fetched resources to avoid re-downloading
const resourceCache: Record<string, string> = {};

// Helper to fetch an image or font and convert it to a Base64 data URL
const urlToDataUrl = async (url: string): Promise<string> => {
    if (resourceCache[url]) {
        return resourceCache[url];
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network response was not ok for ${url}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                resourceCache[url] = dataUrl; // Cache the result
                resolve(dataUrl);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting URL to Data URL:', error);
        // Return a transparent pixel as a fallback for images
        return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
};

export const shareReceiptAsImage = async (transaction: Transaction, settings: AppSettings): Promise<{ success: boolean; message: string }> => {
    try {
        // 1. Prepare data by pre-fetching logo
        const logoDataUrl = await urlToDataUrl(settings.businessLogo || 'https://beeimg.com/images/s77882238754.png');

        // 2. Create a temporary container for the receipt
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = '384px'; // Standard receipt width
        container.style.backgroundColor = '#ffffff';
        container.style.color = '#000000';
        container.style.fontFamily = "'Inter', sans-serif";
        container.style.zIndex = '-1';
        document.body.appendChild(container);

        // 3. Construct HTML content
        const receiptHtml = `
            <div style="padding: 20px; box-sizing: border-box; background: white;">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&family=Space+Mono:wght@700&display=swap');
                    * { box-sizing: border-box; }
                </style>
                <div style="text-align: center; margin-bottom: 15px;">
                    <img src="${logoDataUrl}" alt="logo" style="width: 60px; height: 60px; margin: 0 auto 10px; border-radius: 12px; display: block;" />
                    <h1 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; line-height: 1.2;">${settings.businessName}</h1>
                    <p style="font-size: 11px; margin: 4px 0 0; color: #555;">${settings.businessAddress}</p>
                </div>
                
                <div style="border-top: 2px dashed #ccc; margin: 15px 0;"></div>
                
                <div style="font-size: 12px; line-height: 1.5;">
                    <p style="margin: 0;"><strong>ID:</strong> #${transaction.id.substring(0, 8).toUpperCase()}</p>
                    <p style="margin: 0;"><strong>Tanggal:</strong> ${new Date(transaction.startTime).toLocaleString('id-ID')}</p>
                    <p style="margin: 0;"><strong>Kasir:</strong> ${transaction.operatorName}</p>
                </div>
                
                <div style="border-top: 2px dashed #ccc; margin: 15px 0;"></div>
                
                <div style="font-size: 14px; font-weight: 700; line-height: 1.4;">
                    <p style="margin: 0 0 4px;"><strong>Member:</strong> ${transaction.memberName}</p>
                    <p style="margin: 0 0 4px;"><strong>Unit:</strong> ${transaction.consoleName}</p>
                    <p style="margin: 0;"><strong>Durasi:</strong> ${transaction.durationHours} Jam</p>
                </div>
                
                <div style="border-top: 2px dashed #ccc; margin: 15px 0;"></div>
                
                <div style="font-size: 13px; line-height: 1.6;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Subtotal</span>
                        <span>Rp ${(transaction.cost + transaction.discountApplied).toLocaleString('id-ID')}</span>
                    </div>
                    ${transaction.discountApplied > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #e53e3e;">
                        <span>Diskon</span>
                        <span>-Rp ${transaction.discountApplied.toLocaleString('id-ID')}</span>
                    </div>` : ''}
                </div>
                
                <div style="border-top: 2px solid #000; margin: 15px 0;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 900;">
                    <span>TOTAL</span>
                    <span style="font-family: 'Space Mono', monospace; font-size: 24px;">Rp ${transaction.cost.toLocaleString('id-ID')}</span>
                </div>
                
                <p style="margin: 8px 0 0; font-size: 12px; text-align: right;">Metode: <strong>${transaction.paymentMethod}</strong></p>
                
                <div style="text-align: center; margin-top: 30px; font-size: 12px; font-weight: 700; color: #555;">
                    <p style="margin: 0;">Terima Kasih!</p>
                    <p style="margin: 4px 0 0;">- Happy Gaming -</p>
                </div>
            </div>
        `;

        container.innerHTML = receiptHtml;

        // 4. Use html2canvas to capture the element
        const canvas = await html2canvas(container, {
            scale: 2, // High resolution
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        } as any);

        // Clean up DOM
        document.body.removeChild(container);

        // 5. Convert to Blob and Share/Download
        return new Promise((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    resolve({ success: false, message: 'Gagal membuat gambar struk.' });
                    return;
                }
                
                const fileName = `struk-${transaction.id.substring(0,6)}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });
                
                // Try Web Share API Level 2 (Files)
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Struk Ziezan Station - ${transaction.memberName}`,
                            text: `Berikut struk pembayaran untuk sesi rental di ${settings.businessName}.`,
                        });
                        resolve({ success: true, message: 'Struk dibagikan!' });
                    } catch (error) {
                        if ((error as Error).name !== 'AbortError') {
                           // Fallback to download if share fails (but not if cancelled)
                           downloadImage(blob, fileName);
                           resolve({ success: true, message: 'Struk diunduh (Share gagal).' });
                        } else {
                           resolve({ success: false, message: 'Dibatalkan.'});
                        }
                    }
                } else {
                    // Fallback: Download the image
                    downloadImage(blob, fileName);
                    resolve({ success: true, message: 'Struk berhasil diunduh.' });
                }
            }, 'image/png');
        });

    } catch (error) {
        console.error('Share Receipt Error:', error);
        return { success: false, message: 'Terjadi kesalahan saat memproses gambar.' };
    }
};

const downloadImage = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
