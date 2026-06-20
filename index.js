export default {
  async fetch(request) {
    // 1. Ambil target URL asli dari header khusus yang dikirim oleh backend Kreaverse
    const targetUrl = request.headers.get("X-Target-Url");
    
    // Jika tidak ada target URL, tolak request (Keamanan)
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing X-Target-Url header" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 2. Siapkan header untuk diteruskan ke penyedia API
    const newHeaders = new Headers(request.headers);
    newHeaders.delete("X-Target-Url"); // Hapus header rahasia kita
    newHeaders.delete("Host"); // Wajib dihapus agar Cloudflare menyesuaikan Host otomatis

    const init = {
      method: request.method,
      headers: newHeaders,
    };

    // 3. Jika ini request POST (mengirim payload JSON), teruskan body-nya
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.clone().arrayBuffer();
    }

    try {
      // 4. Tembak API tujuan menggunakan IP Cloudflare yang ter-rotasi otomatis!
      const response = await fetch(targetUrl, init);

      // 5. Kembalikan hasilnya ke backend Vercel Anda
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Proxy failed to reach target", details: error.message }), { 
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
