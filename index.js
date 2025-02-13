process.on('uncaughtException', console.error); // Menangkap kesalahan yang tidak tertangani

const {
  default: WAConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  Browsers,
  fetchLatestWaWebVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require('readline');
const { Boom } = require("@hapi/boom");
const settings = require('./settings'); // Import settings.js
const cfonts = require('cfonts'); // Import cfonts
const { random } = require('lodash'); // Import lodash
const fs = require('fs'); // Import fs untuk file system

const pairingCode = process.argv.includes("--pairing-code");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

// Fungsi untuk menghasilkan warna acak
function randomColor() {
  const colors = [
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'gray', 'redBright', 'greenBright', 'yellowBright', 'blueBright',
    'magentaBright', 'cyanBright', 'whiteBright',
    '#3456ff', '#f80' // Tambahkan contoh hex color
  ];
  return colors[random(0, colors.length - 1)];
}

// Fungsi untuk menampilkan teks dengan warna
function colorText(text, color) {
  let colorCode = {
    'black': '\x1b[30m',
    'red': '\x1b[31m',
    'green': '\x1b[32m',
    'yellow': '\x1b[33m',
    'blue': '\x1b[34m',
    'magenta': '\x1b[35m',
    'cyan': '\x1b[36m',
    'white': '\x1b[37m',
    'brightBlack': '\x1b[90m',
    'brightRed': '\x1b[91m',
    'brightGreen': '\x1b[92m',
    'brightYellow': '\x1b[93m',
    'brightBlue': '\x1b[94m',
    'brightMagenta': '\x1b[95m',
    'brightCyan': '\x1b[96m',
    'brightWhite': '\x1b[97m',
  }[color];

  return `${colorCode}${text}\x1b[0m`; // Reset warna
}

// Fungsi untuk membaca data dari file JSON
function readStatusData() {
  try {
    const data = fs.readFileSync('./status_data.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // Jika file tidak ada, buat file baru dengan data kosong
    return {};
  }
}

// Fungsi untuk menyimpan data ke file JSON
function saveStatusData(data) {
  fs.writeFileSync('./status_data.json', JSON.stringify(data, null, 2), 'utf8');
}

// Fungsi untuk membaca data delete status dari file JSON
function readDeleteStatusData() {
  try {
    const data = fs.readFileSync('./delete_status_data.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // Jika file tidak ada, buat file baru dengan data kosong
    return {};
  }
}

// Fungsi untuk menyimpan data delete status ke file JSON
function saveDeleteStatusData(data) {
  fs.writeFileSync('./delete_status_data.json', JSON.stringify(data, null, 2), 'utf8');
}

// Fungsi untuk menampilkan statistik status
function displayStatusStatistics() {
  if (settings.showStatistics) { // Periksa apakah showStatistics diaktifkan di settings.js
    // Load status data from file
    let statusData = readStatusData();
    let deleteStatusData = readDeleteStatusData();

    console.log("---------- Statistik Status ----------"); // Judul baru

    // Tampilkan total view status jika diaktifkan
    if (settings.showViewStatus) {
      console.log("Total View Status:");
      for (const username in statusData) {
        // Hanya cetak jika username tidak undefined
        if (username) {
          console.log(`${username}: ${statusData[username]}`);
        }
      }
    }

    // Tampilkan total delete status jika diaktifkan
    if (settings.showDeleteStatus) {
      console.log("Total Delete Status:");
      for (const username in deleteStatusData) {
        // Hanya cetak jika username tidak undefined
        if (username) {
          console.log(`${username}: ${deleteStatusData[username]}`);
        }
      }
    }

    console.log("----------------------------------"); // Garis pemisah
  }
}

async function WAStart() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("./sesi");

    // Tampilkan teks dengan cfonts
    cfonts.say('auto-read-sw\nby-wily-kun', { // Tampilkan teks dengan cfonts
      font: 'tiny',
      align: 'center',
      colors: [randomColor(), randomColor()], // Gunakan warna acak
      background: 'transparent',
      letterSpacing: 1,
      lineHeight: 1,
      space: true,
      maxLength: '0',
      gradient: false,
      independentGradient: false,
      transitionGradient: false,
      env: 'node'
    });

    // Tampilkan daftar fitur dengan status aktif/tidak aktif
    console.log("---------- Daftar Fitur ----------");
    console.log(colorText("1. Auto Read Status: ", 'blue') + (settings.autoReadStory ? colorText("✅ Aktif", 'green') : colorText("❌ Tidak Aktif", 'red')));
    console.log(colorText("2. Auto Typing: ", 'blue') + (settings.autoTyping ? colorText("✅ Aktif", 'green') : colorText("❌ Tidak Aktif", 'red')));
    console.log(colorText("3. Update Bio (Aktif Selama Uptime): ", 'blue') + (settings.bioActive ? colorText("✅ Aktif", 'green') : colorText("❌ Tidak Aktif", 'red')));
    console.log(colorText("4. USER MENGHAPUS STATUSNYA : ", 'blue') + (settings.deleteStatus ? colorText("✅ Aktif", 'green') : colorText("❌ Tidak Aktif", 'red'))); // Diubah
    console.log(colorText("5. Show Statistics: ", 'blue') + (settings.showStatistics ? colorText("✅ Aktif", 'green') : colorText("❌ Tidak Aktif", 'red'))); // Ditambahkan
    console.log(colorText("6. Show View Status: ", 'blue') + (settings.showViewStatus ? colorText("✅ Aktif", 'green') : colorText("❌ Tidak Aktif", 'red'))); // Ditambahkan
    console.log(colorText("7. Show Delete Status: ", 'blue') + (settings.showDeleteStatus ? colorText("✅ Aktif", 'green') : colorText("❌ Tidak Aktif", 'red'))); // Ditambahkan
    console.log("----------------------------------"); // Garis pemisah dengan panjang sama

    // Sekarang tampilkan versi WA setelah daftar fitur
    const { version, isLatest } = await fetchLatestWaWebVersion().catch(() => fetchLatestBaileysVersion());
    console.log("menggunakan WA v" + version.join(".") + ", isLatest: " + isLatest);

    const client = WAConnect({
      logger: pino({ level: "silent" }),
      printQRInTerminal: !pairingCode,
      browser: Browsers.ubuntu("Chrome"),
      auth: state,
    });

    store.bind(client.ev);

    if (pairingCode && !client.authState.creds.registered) {
      const phoneNumber = await question("Silahkan masukin nomor Whatsapp kamu: ");
      let code = await client.requestPairingCode(phoneNumber);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      console.log("⚠︎ Kode Whatsapp kamu : " + code);
    }

    // Variabel untuk menyimpan waktu mulai bot
    let startTime = Date.now();

    // Fungsi untuk menghitung uptime
    function calculateUptime() {
      const now = Date.now();
      const uptimeMs = now - startTime;
      const seconds = Math.floor(uptimeMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let uptimeString = "";
      if (days > 0) {
        uptimeString += days + " hari ";
      }
      if (hours % 24 > 0) {
        uptimeString += hours % 24 + " jam ";
      }
      if (minutes % 60 > 0) {
        uptimeString += minutes % 60 + " menit ";
      }
      uptimeString += seconds % 60 + " detik ";

      return uptimeString;
    }

    // Fungsi untuk mengatur kecepatan melihat status
    function setReadStatusSpeed(speed) {
      if (speed < 1000) {
        console.log("Kecepatan minimal 1 detik (1000 milidetik).");
        return 1000;
      } else {
        return speed;
      }
    }

    // Atur kecepatan awal (sekarang dari settings.js)
    let readStatusSpeed = settings.readStatusSpeed;

    // Update Bio
    let bioInterval = setInterval(async () => {
      if (settings.bioActive) { // Periksa nilai bioActive dari settings.js
        const uptimeText = calculateUptime();
        await client.updateProfileStatus("Aktif Selama " + uptimeText + " ⏳");
      }
    }, 10000); // Update bio every 10 seconds

    // Load status data from file
    let statusData = readStatusData();
    let deleteStatusData = readDeleteStatusData();

    // Tampilkan statistik saat bot dimulai
    displayStatusStatistics();

    client.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const m = chatUpdate.messages[0];
        if (!m.message) return;
        if (m.key && !m.key.fromMe && m.key.remoteJid === 'status@broadcast' && settings.autoReadStory) { // Periksa nilai autoReadStory
          // Membaca cerita
          client.readMessages([m.key]);
          const username = m.key.participant.split('@')[0];
          // Hanya cetak jika username tidak undefined
          if (username) { 
            console.log(colorText("AUTO LIHAT STATUS ✅", 'blue'), username); // Warna biru
          }

          // Increment counter for this user
          if (statusData[username]) {
            statusData[username]++;
          } else {
            statusData[username] = 1;
          }

          // Save updated data to file
          saveStatusData(statusData);

          // Tunggu sebelum membaca status berikutnya
          await new Promise(resolve => setTimeout(resolve, readStatusSpeed));
        }

        // Kirim pesan "Typing..." jika autoTyping diaktifkan
        if (settings.autoTyping && !m.key.fromMe) {
          await client.sendPresenceUpdate("composing", m.key.remoteJid);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Tunggu 1 detik
          await client.sendPresenceUpdate("paused", m.key.remoteJid);
        }

        // Hapus status jika diaktifkan
        if (settings.deleteStatus && !m.key.fromMe && m.key.remoteJid === 'status@broadcast') {
          client.readMessages([m.key]);
          const username = m.key.participant.split('@')[0];
          // Hanya cetak jika username tidak undefined
          if (username) {
            console.log(colorText("USER MENGHAPUS STATUSNYA : ", randomColor()), username);
          }

          // Increment delete counter for this user
          if (deleteStatusData[username]) {
            deleteStatusData[username]++;
          } else {
            deleteStatusData[username] = 1;
          }

          // Save updated data to file
          saveDeleteStatusData(deleteStatusData);
        }
      } catch (err) {
        console.log(err);
      }
    });

    // ... (sisa kode koneksi dan penanganan event)

    client.ev.on("messages.update", async (updates) => {
      try {
        updates.forEach(update => {
          if (update.key && update.key.remoteJid === 'status@broadcast' && update.update.status === 'remove' && settings.deleteStatus) {
            const username = update.key.participant.split('@')[0];
            console.log(colorText("USER MENGHAPUS STATUSNYA : ", 'red'), username); // Ganti 'randomColor()' dengan 'red'

            // Increment delete counter for this user
            if (deleteStatusData[username]) {
              deleteStatusData[username]++;
            } else {
              deleteStatusData[username] = 1;
            }

            // Save updated data to file
            saveDeleteStatusData(deleteStatusData);
          }
        });
      } catch (err) {
        console.log(err);
      }
    });

    client.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        // Stop bio update when bot disconnects
        if (bioInterval) {
          clearInterval(bioInterval);
        }

        let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
        if (reason === DisconnectReason.badSession) {
          console.log("File Sesi Buruk, Silahkan Hapus Sesi dan Pindai Lagi");
          process.exit();
        } else if (reason === DisconnectReason.connectionClosed) {
          console.log("Koneksi ditutup, menyambung kembali....");
          WAStart();
        } else if (reason === DisconnectReason.connectionLost) {
          console.log("Koneksi Hilang dari Server, menyambung kembali...");
          WAStart();
        } else if (reason === DisconnectReason.connectionReplaced) {
          console.log("Koneksi Diganti, Sesi Baru Dibuka, Silahkan Mulai Ulang Bot");
          process.exit();
        } else if (reason === DisconnectReason.loggedOut) {
          console.log("Perangkat Keluar, Silahkan Hapus Folder Sesi dan Pindai Lagi.");
          process.exit();
        } else if (reason === DisconnectReason.restartRequired) {
          console.log("Mulai Ulang Diperlukan, Memulai Ulang...");
          WAStart();
        } else if (reason === DisconnectReason.timedOut) {
          console.log("Koneksi Habis Waktu, Menyambung Kembali...");
          WAStart();
        } else {
          console.log("Alasan Disconnect Tidak Diketahui: " + reason + "|" + connection);
          WAStart();
        }
      } else if (connection === "open") {
        console.log("Terhubung ke Readsw");
        // Tampilkan total view status
        // console.log("Total View Status:");
        // for (const username in statusData) {
        //   // Hanya cetak jika username tidak undefined
        //   if (username) {
        //     console.log(`${username}: ${statusData[username]}`);
        //   }
        // }
        // Tampilkan total delete status
        // console.log("Total Delete Status:");
        // for (const username in deleteStatusData) {
        //   // Hanya cetak jika username tidak undefined
        //   if (username) {
        //     console.log(`${username}: ${deleteStatusData[username]}`);
        //   }
        // }
      }
    });

    client.ev.on("creds.update", saveCreds);

    return client;
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
    process.exit(1); // Keluar dengan kode kesalahan
  }
}

WAStart();