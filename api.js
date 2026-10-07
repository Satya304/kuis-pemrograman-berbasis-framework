<!-- ================= JAVASCRIPT CRUD================= -->
    <script>
        // DAFTAR LINK ENDPOINT API:
        const API_READ = "https://api.melangkah.my.id/unit/read.php";
        const API_CREATE = "https://api.melangkah.my.id/unit/create.php";
        const API_UPDATE = "https://api.melangkah.my.id/unit/update.php";
        const API_DELETE = "https://api.melangkah.my.id/asset/delete.php";
        const API_DETAIL = "https://api.melangkah.my.id/asset/detail.php";

        const STORAGE_KEY = "SIAKAD_ASSET_DATA";
        let assetList = [];

        // Data bawaan standar
        const defaultAssets = [
            {
                id: 1,
                kode_asset: "AST-001",
                nama_asset: "Proyektor Epson EB-X400",
                kategori: "Elektronik",
                kondisi: "Baik",
                status: "Tersedia",
            },
            {
                id: 2,
                kode_asset: "AST-002",
                nama_asset: "Laptop Asus ExpertBook Core i5",
                kategori: "Elektronik",
                kondisi: "Baik",
                status: "Dipinjam",
            },
            {
                id: 3,
                kode_asset: "AST-003",
                nama_asset: "Kamera DSLR Canon EOS 3000D",
                kategori: "Perlengkapan Acara",
                kondisi: "Rusak",
                status: "Tersedia",
            },
        ];

        // Simpan ke storage lokal agar saat refresh tidak kembali ke semula
        function saveToStorage() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(assetList));
        }

        // 1. READ DATA
        function loadDataAsset() {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                assetList = JSON.parse(savedData);
                renderTable(assetList);
            } else {
                fetch(API_READ)
                    .then((response) => response.json())
                    .then((data) => {
                        let apiItems = Array.isArray(data) ? data : data.data || [];
                        if (apiItems.length > 0) {
                            // Normalisasi agar kondisi & status sesuai 2 pilihan
                            assetList = apiItems.map((item) => ({
                                id_unit: item.id_unit || item.id_unit,
                                nama_unit: item.nama_unit || item.nama,
                                tipe_ps: item.tipe_ps || "PS5",
                                harga_per_jam: item.harga_per_jam || item.harga_per_jam,
                                status:
                                    item.status && item.status.toLowerCase().includes("disewa")
                                        ? "Disewa"
                                        : "Tersedia",
                            }));
                        } else {
                            assetList = defaultAssets;
                        }
                        saveToStorage();
                        renderTable(assetList);
                    })
                    .catch(() => {
                        assetList = defaultAssets;
                        saveToStorage();
                        renderTable(assetList);
                    });
            }
        }

        // Reset manual jika ingin sync ulang dari API
        function resetToApiData() {
            localStorage.removeItem(STORAGE_KEY);
            loadDataAsset();
            alert("Data di-refresh ulang dari API!");
        }

        function renderTable(data) {
            let html = "";
            if (!data || data.length === 0) {
                html = `<tr><td colspan="6" class="text-center text-muted py-3">Tidak ada data Unit ditemukan.</td></tr>`;
            } else {
                data.forEach((item, index) => {
                    let badgeClass = item.status && item.status.toLowerCase() === "disewa" ? "badge-disewa" : "badge-tersedia";
                    let currentId = item.id_unit || item.id;

                    html += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="font-weight-bold text-dark">${item.nama_unit}</td>
                    <td>${item.tipe_ps || "PS5"}</td>
                    <td class="font-weight-bold text-dark">${item.harga_per_jam}</td>
                    <td><span class="badge-status-asset ${badgeClass}">${item.status || "Tersedia"}</span></td>
                    <td class="text-center">
                        <div class="action-container">
                            <button type="button" class="btn-action-edit" title="Edit" onclick="openEditModal('${currentId}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn-action-delete" title="Hapus" onclick="hapusAsset('${currentId}')">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
                });
            }
            $("#tbodyAsset").html(html);
        }

        // 2. CREATE DATA (create.php)
        $("#formTambahAsset").on("submit", async function (e) {
            e.preventDefault();

            const payload = {
                nama_unit: $("#addnama_unit").val(),
                tipe_ps: $("#addtipe_ps").val(),
                harga_per_jam: $("#addharga_per_jam").val(),
                status: $("#addStatus").val(),
            };

            try {
                const response = await fetch(API_CREATE, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();
                console.log("Respon API:", result);

                if (response.ok) {
                    alert("Data Unit Berhasil Ditambahkan ke Server!");

                    localStorage.removeItem(STORAGE_KEY);

                    $("#modalTambahAsset").modal("hide");
                    $("#formTambahAsset")[0].reset();

                    loadDataAsset();
                } else {
                    alert(
                        "Gagal menambahkan ke server: " + (result.message || "Error"),
                    );
                }
            } catch (error) {
                console.error("Error kirim data:", error);
            }
        });

        // 3. EDIT & UPDATE DATA 
        function openEditModal(id) {
          
            const item = assetList.find((a) => (a.id_unit || a.id) == id);

            if (item) {
                $("#editId").val(item.id_unit || item.id);
                $("#editnama_unit").val(item.nama_unit);
                $("#edittipe_ps").val(item.tipe_ps || "PS5");
                $("#editharga_per_jam").val(item.harga_per_jam);

                const statusVal = (item.status && item.status.toLowerCase().includes("sewa"))
                    ? "Disewa"
                    : "Tersedia";
                $("#editStatus").val(statusVal);

                $("#modalEditAsset").modal("show");
            } else {
                alert("Data tidak ditemukan!");
            }
        }

        // SIMPAN PERUBAHAN KE SERVER (update.php)
        $("#formEditAsset").on("submit", async function (e) {
            e.preventDefault();

            const id = $("#editId").val();

            const updatePayload = {
                id_unit: id,
                id: id,
                nama_unit: $("#editnama_unit").val(),
                tipe_ps: $("#edittipe_ps").val(),
                harga_per_jam: $("#editharga_per_jam").val(),
                status: $("#editStatus").val(),
            };

            try {
                
                const response = await fetch(API_UPDATE, {
                    method: "POST", 
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(updatePayload)
                });

                const result = await response.json();
                console.log("Respon Update:", result);

                if (response.ok) {
                    alert("Data Unit Berhasil Diperbarui!");

                    localStorage.removeItem(STORAGE_KEY);

                    $("#modalEditAsset").modal("hide");

                    loadDataAsset();
                } else {
                    alert("Gagal update data di server: " + (result.message || "Error"));
                }
            } catch (error) {
                console.error("Error update:", error);
                alert("Terjadi kesalahan saat memperbarui data!");
            }
        });

        // 4. DELETE DATA (delete.php)
        function hapusAsset(id) {
            if (confirm("Apakah Anda yakin ingin menghapus data asset ini?")) {
                assetList = assetList.filter((a) => a.id != id);
                saveToStorage();
                renderTable(assetList);

                let fd = new FormData();
                fd.append("id", id);
                fetch(`${API_DELETE}?id=${id}`, {method: "POST", body: fd}).catch(
                    (e) => console.log(e),
                );

                alert("Data Asset Berhasil Dihapus!");
            }
        }

        $(document).ready(function () {
            loadDataAsset();
        });
    </script>