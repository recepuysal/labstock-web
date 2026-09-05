// Masaüstü kısayolunun arka planda bıraktığı sunucu, port 4317'de sürüp
// gidebilir. Yeniden derlemeden önce onu kapatıyoruz ki bir sonraki
// başlatmada eski değil, yeni derleme çalışsın.

const { execSync } = require('child_process');

const PORT = 4317;

try {
  const cikti = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
  const pidler = new Set(
    cikti
      .split('\n')
      .filter((satir) => satir.includes('LISTENING'))
      .map((satir) => satir.trim().split(/\s+/).pop())
      .filter((pid) => pid && /^\d+$/.test(pid) && pid !== '0'),
  );

  for (const pid of pidler) {
    try {
      execSync(`taskkill /F /PID ${pid}`);
      console.log(`Eski sunucu kapatıldı (PID ${pid}).`);
    } catch {
      // zaten kapanmış olabilir, sorun değil
    }
  }
} catch {
  // port zaten boşta — kapatılacak bir şey yok
}
