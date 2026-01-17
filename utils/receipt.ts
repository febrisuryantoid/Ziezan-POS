import { Transaction, AppSettings } from '../types';

// --- BROWSER / WI-FI PRINTING ---
export const printReceiptBrowser = (transaction: Transaction, settings: AppSettings) => {
  const width = 300; 
  const height = 600;
  const left = (window.screen.width / 2) - (width / 2);
  const top = (window.screen.height / 2) - (height / 2);

  const printWindow = window.open('', '_blank', `width=${width},height=${height},top=${top},left=${left}`);

  if (!printWindow) {
      alert("Pop-up diblokir. Izinkan pop-up untuk mencetak.");
      return;
  }

  const receiptContent = `
    <html>
      <head>
        <title>Struk Pembayaran</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page { margin: 0; size: 58mm auto; }
          body { font-family: 'Courier New', monospace; margin: 0; padding: 5px; font-size: 12px; color: #000; width: 58mm; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .title { font-size: 16px; font-weight: bold; display: block; margin-bottom: 5px; text-transform: uppercase; }
          .meta { font-size: 10px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          .qris { text-align: center; margin-top: 10px; font-weight: bold; border: 1px solid #000; padding: 5px; }
          
          /* Hide button in print */
          @media print {
              .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="title">${settings.businessName || 'ZIEZAN STATION'}</span>
          <span class="meta">${settings.businessAddress}</span><br/>
          <span class="meta">${settings.businessPhone}</span>
        </div>

        <div class="meta">
          No: #${transaction.id.toUpperCase()}<br/>
          Tgl: ${new Date(transaction.startTime).toLocaleDateString()} ${new Date(transaction.startTime).toLocaleTimeString()}<br/>
          Kasir: ${transaction.operatorName}
        </div>

        <div class="divider"></div>

        <div class="item">
          <span>Member:</span>
          <span>${transaction.memberName}</span>
        </div>
        <div class="item">
          <span>Unit:</span>
          <span>${transaction.consoleName}</span>
        </div>
        <div class="item">
          <span>Durasi:</span>
          <span>${transaction.durationHours} Jam</span>
        </div>

        <div class="divider"></div>

        <div class="item">
          <span>Subtotal:</span>
          <span>Rp ${(transaction.cost + transaction.discountApplied).toLocaleString()}</span>
        </div>

        ${transaction.discountApplied > 0 ? `
        <div class="item">
          <span>Diskon:</span>
          <span>-Rp ${transaction.discountApplied.toLocaleString()}</span>
        </div>
        ` : ''}

        <div class="divider"></div>

        <div class="item total">
          <span>TOTAL:</span>
          <span>Rp ${transaction.cost.toLocaleString()}</span>
        </div>
        
        <div class="item">
          <span>Metode:</span>
          <span>${transaction.paymentMethod === 'BONUS' ? 'BONUS (FREE)' : transaction.paymentMethod}</span>
        </div>

        <div class="footer">
          Terima kasih atas kunjungan Anda.<br/>
          <strong>Happy Gaming!</strong>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Print Sekarang</button>
        </div>
        
        <script>
            // Auto print on load for convenience
            window.onload = function() { setTimeout(function(){ window.print(); }, 500); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(receiptContent);
  printWindow.document.close();
};

// --- BLUETOOTH THERMAL PRINTER (ESC/POS) ---
// Helper to encode string to Uint8Array
const encode = (s: string) => new TextEncoder().encode(s);

// Commands
const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';
const CENTER = ESC + 'a' + '\x01';
const LEFT = ESC + 'a' + '\x00';
const RIGHT = ESC + 'a' + '\x02';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const CUT = GS + 'V' + '\x41' + '\x03'; // Cut paper

export const generateEscPosCommand = (tx: Transaction, settings: AppSettings): Uint8Array => {
    let commands: Uint8Array[] = [];

    const add = (str: string) => commands.push(encode(str));
    const addCmd = (cmd: string) => commands.push(encode(cmd));
    const addLine = (str: string) => commands.push(encode(str + '\n'));
    
    // 1. Initialize
    addCmd(INIT);
    
    // 2. Header
    addCmd(CENTER);
    addCmd(BOLD_ON);
    addLine(settings.businessName.toUpperCase());
    addCmd(BOLD_OFF);
    addLine("PlayStation Rental & Cafe");
    addLine(settings.businessAddress);
    addLine(settings.businessPhone);
    addLine("--------------------------------");
    
    // 3. Meta
    addCmd(LEFT);
    addLine(`No: #${tx.id.toUpperCase()}`);
    addLine(`Tgl: ${new Date(tx.startTime).toLocaleDateString()} ${new Date(tx.startTime).toLocaleTimeString().slice(0,5)}`);
    addLine(`Kasir: ${tx.operatorName}`);
    addLine("--------------------------------");

    // 4. Items
    addLine(`Member : ${tx.memberName}`);
    addLine(`Unit   : ${tx.consoleName}`);
    addLine(`Durasi : ${tx.durationHours} Jam @ ${settings.hourlyRate.toLocaleString()}`);
    
    addLine("--------------------------------");

    // 5. Totals
    // Simple alignment hack for thermal printers (32 chars width usually)
    const formatRow = (label: string, value: string) => {
        const space = 32 - label.length - value.length;
        return label + ' '.repeat(Math.max(0, space)) + value;
    };

    addLine(formatRow("Subtotal", `Rp ${(tx.cost + tx.discountApplied).toLocaleString()}`));
    
    if (tx.discountApplied > 0) {
        addLine(formatRow("Diskon", `-Rp ${tx.discountApplied.toLocaleString()}`));
    }
    
    addCmd(BOLD_ON);
    addLine(formatRow("TOTAL", `Rp ${tx.cost.toLocaleString()}`));
    addCmd(BOLD_OFF);
    
    // Explicitly show BONUS if method is BONUS
    const methodDisplay = tx.paymentMethod === 'BONUS' ? 'BONUS (FREE)' : tx.paymentMethod;
    addLine(formatRow("Metode", methodDisplay));
    
    addLine("--------------------------------");
    
    // 6. Footer
    addCmd(CENTER);
    addLine("Terima kasih atas kunjungan Anda");
    addLine("Happy Gaming!");
    addLine("\n\n"); // Feed line
    
    // 7. Cut (Optional, depends on printer)
    // addCmd(CUT); 

    // Combine all chunks
    const totalLength = commands.reduce((acc, curr) => acc + curr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const cmd of commands) {
        result.set(cmd, offset);
        offset += cmd.length;
    }

    return result;
};

// Unified function used by buttons
export const printReceipt = (tx: Transaction, settings: AppSettings) => {
    // Default to browser print as it is universal
    printReceiptBrowser(tx, settings);
};