
import { Transaction, AppSettings } from '../types';

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
    // 1. Prepare data by pre-fetching all external resources
    const [logoDataUrl, interFontDataUrl, spaceMonoFontDataUrl] = await Promise.all([
        urlToDataUrl(settings.businessLogo || 'https://beeimg.com/images/s77882238754.png'),
        // Fetch WOFF2 font files for embedding
        urlToDataUrl('https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5n-wU.woff2'),
        urlToDataUrl('https://fonts.gstatic.com/s/spacemono/v13/i7dMIFliZjgestTsoupSWfc-CiAG-sY-gA.woff2')
    ]);

    const receiptWidth = 384;
    const estimatedHeight = 550;
    
    // 2. Construct HTML with EMBEDDED styles (no external @import)
    const receiptHtml = `
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: ${receiptWidth}px; padding: 20px; background-color: #ffffff; color: #000000; font-family: 'Inter', sans-serif; box-sizing: border-box;">
            <style>
                @font-face {
                    font-family: 'Inter';
                    src: url(${interFontDataUrl}) format('woff2');
                    font-weight: 400 900;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Space Mono';
                    src: url(${spaceMonoFontDataUrl}) format('woff2');
                    font-weight: 700;
                    font-style: normal;
                }
                * { box-sizing: border-box; }
            </style>
            <div style="text-align: center; margin-bottom: 15px;">
                <img src="${logoDataUrl}" alt="logo" style="width: 60px; height: 60px; margin: 0 auto 10px; border-radius: 12px;" />
                <h1 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase;">${settings.businessName}</h1>
                <p style="font-size: 11px; margin: 2px 0 0;">${settings.businessAddress}</p>
            </div>
            <div style="border-top: 2px dashed #ccc; margin: 15px 0;"></div>
            <div style="font-size: 12px;">
                <p style="margin: 0 0 5px;"><strong>ID:</strong> #${transaction.id.substring(0, 8).toUpperCase()}</p>
                <p style="margin: 0 0 5px;"><strong>Tanggal:</strong> ${new Date(transaction.startTime).toLocaleString('id-ID')}</p>
                <p style="margin: 0 0 5px;"><strong>Kasir:</strong> ${transaction.operatorName}</p>
            </div>
            <div style="border-top: 2px dashed #ccc; margin: 15px 0;"></div>
            <div style="font-size: 14px; font-weight: 700;">
                <p style="margin: 0 0 8px;"><strong>Member:</strong> ${transaction.memberName}</p>
                <p style="margin: 0 0 8px;"><strong>Unit:</strong> ${transaction.consoleName}</p>
                <p style="margin: 0;"><strong>Durasi:</strong> ${transaction.durationHours} Jam</p>
            </div>
            <div style="border-top: 2px dashed #ccc; margin: 15px 0;"></div>
            <div style="font-size: 13px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Subtotal</span>
                    <span>Rp ${(transaction.cost + transaction.discountApplied).toLocaleString('id-ID')}</span>
                </div>
                ${transaction.discountApplied > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #e53e3e;">
                    <span>Diskon</span>
                    <span>-Rp ${transaction.discountApplied.toLocaleString('id-ID')}</span>
                </div>` : ''}
            </div>
            <div style="border-top: 2px solid #000; margin: 15px 0;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 900;">
                <span>TOTAL</span>
                <span style="font-family: 'Space Mono', monospace; font-size: 24px;">Rp ${transaction.cost.toLocaleString('id-ID')}</span>
            </div>
             <p style="margin: 5px 0 0; font-size: 12px; text-align: right;">Metode: <strong>${transaction.paymentMethod}</strong></p>
            <div style="text-align: center; margin-top: 25px; font-size: 12px; font-weight: 700;">
                <p style="margin: 0;">Terima Kasih!</p>
                <p style="margin: 2px 0 0;">- Happy Gaming -</p>
            </div>
        </div>
    `;

    // 3. Create SVG with <foreignObject>
    const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${receiptWidth}" height="${estimatedHeight}">
            <foreignObject width="100%" height="100%">
                ${receiptHtml}
            </foreignObject>
        </svg>
    `;

    // 4. SVG -> Canvas -> Blob
    const canvas = document.createElement('canvas');
    canvas.width = receiptWidth * 2; // Render at 2x for HD quality
    canvas.height = estimatedHeight * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { success: false, message: 'Canvas context failed' };
    
    ctx.scale(2, 2); // Scale up context

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    resolve({ success: false, message: 'Gagal membuat gambar struk.' });
                    return;
                }
                
                const file = new File([blob], `struk-${transaction.id.substring(0,6)}.png`, { type: 'image/png' });
                
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
                           resolve({ success: false, message: 'Gagal membagikan struk.' });
                        } else {
                           resolve({ success: false, message: 'Dibatalkan.'});
                        }
                    }
                } else {
                    resolve({ success: false, message: 'Fitur Share tidak didukung di browser ini.' });
                }
            }, 'image/png');
        };
        img.onerror = () => {
             URL.revokeObjectURL(url);
             resolve({ success: false, message: 'Gagal memuat gambar struk.' });
        }
        img.src = url;
    });
};
