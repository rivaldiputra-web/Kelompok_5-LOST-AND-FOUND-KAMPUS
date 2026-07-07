export const swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'LostFound Campus API',
        version: '1.0.0',
        description:
            'REST API untuk sistem pelaporan barang hilang dan temuan di lingkungan kampus. ' +
            'Gunakan endpoint `/api/auth/login` untuk mendapatkan Bearer Token, lalu klik tombol **Authorize** di atas.',
        contact: {
            name: 'Tim Pengembang'
        }
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Development Server' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Masukkan access token JWT yang diperoleh dari endpoint login.'
            }
        },
        schemas: {
            // ─── GENERIC ────────────────────────────────────────────────
            ErrorResponse: {
                type: 'object',
                properties: {
                    status: { type: 'boolean', example: false },
                    errors: { type: 'string', example: 'Pesan error dari server' }
                }
            },
            PaginationMeta: {
                type: 'object',
                properties: {
                    page: { type: 'integer', example: 1 },
                    size: { type: 'integer', example: 10 },
                    total_items: { type: 'integer', example: 42 },
                    total_pages: { type: 'integer', example: 5 }
                }
            },

            // ─── USER ───────────────────────────────────────────────────
            UserProfile: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    nim_nip: { type: 'string', example: '1234567890' },
                    name: { type: 'string', example: 'Budi Santoso' },
                    email: { type: 'string', format: 'email', example: 'budi@kampus.edu' },
                    phone_number: { type: 'string', example: '081234567890', nullable: true },
                    role: { type: 'string', enum: ['user', 'admin'], example: 'user' }
                }
            },
            RegisterRequest: {
                type: 'object',
                required: ['nim_nip', 'name', 'email', 'password'],
                properties: {
                    nim_nip: { type: 'string', maxLength: 50, example: '1234567890' },
                    name: { type: 'string', maxLength: 255, example: 'Budi Santoso' },
                    email: { type: 'string', format: 'email', example: 'budi@kampus.edu' },
                    password: { type: 'string', format: 'password', example: 'rahasia123' },
                    phone_number: { type: 'string', maxLength: 20, example: '081234567890' }
                }
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: {
                        type: 'string',
                        example: 'budi@kampus.edu',
                        description: 'Bisa diisi dengan email atau NIM/NIP'
                    },
                    password: { type: 'string', format: 'password', example: 'rahasia123' }
                }
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    status: { type: 'boolean', example: true },
                    accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    data: {
                        type: 'object',
                        properties: {
                            nim_nip: { type: 'string', example: '1234567890' },
                            name: { type: 'string', example: 'Budi Santoso' }
                        }
                    }
                }
            },
            UpdateProfileRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string', maxLength: 255, example: 'Budi Diupdate' },
                    email: { type: 'string', format: 'email', example: 'budi.baru@kampus.edu' },
                    nim_nip: { type: 'string', maxLength: 50 },
                    password: { type: 'string', format: 'password', example: 'passwordbaru' },
                    phone_number: { type: 'string', maxLength: 20, example: '081299999999' }
                }
            },
            AdminCreateUserRequest: {
                type: 'object',
                required: ['nim_nip', 'name', 'email', 'password'],
                properties: {
                    nim_nip: { type: 'string', maxLength: 50, example: 'NIP2026STAFF' },
                    name: { type: 'string', maxLength: 255, example: 'Staff Baru' },
                    email: { type: 'string', format: 'email', example: 'staff@kampus.edu' },
                    password: { type: 'string', format: 'password', example: 'rahasia123' },
                    phone_number: { type: 'string', maxLength: 20 },
                    role: { type: 'string', enum: ['user', 'admin'], example: 'user' }
                }
            },
            AdminUpdateUserRequest: {
                type: 'object',
                properties: {
                    nim_nip: { type: 'string', maxLength: 50 },
                    name: { type: 'string', maxLength: 255 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                    phone_number: { type: 'string', maxLength: 20 },
                    role: { type: 'string', enum: ['user', 'admin'] }
                }
            },

            // ─── CATEGORY ───────────────────────────────────────────────
            Category: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Elektronik' }
                }
            },
            CategoryRequest: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', example: 'Alat Tulis' }
                }
            },

            // ─── ITEM ────────────────────────────────────────────────────
            Item: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 101 },
                    slug: { type: 'string', example: 'dompet-kulit-coklat' },
                    type: { type: 'string', enum: ['lost', 'found'], example: 'lost' },
                    status: {
                        type: 'string',
                        enum: ['pending_verification', 'available', 'returned', 'searching', 'resolved'],
                        example: 'searching'
                    },
                    title: { type: 'string', example: 'Dompet Kulit Coklat' },
                    description: { type: 'string', example: 'Di dalamnya ada KTP dan kartu ATM' },
                    location: { type: 'string', example: 'Kantin Gedung A' },
                    date_time: { type: 'string', format: 'date-time', example: '2026-06-01T10:30:00.000Z' },
                    image_path: { type: 'string', nullable: true, example: '/uploads/img-123456789.jpg' },
                    category: { '$ref': '#/components/schemas/Category' },
                    user: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', example: 'Budi Santoso' }
                        }
                    },
                    boost_count: { type: 'integer', example: 5 },
                    comment_count: { type: 'integer', example: 3 },
                    is_boosted_by_me: { type: 'boolean', example: false },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            ItemCreateRequest: {
                type: 'object',
                required: ['category_id', 'type', 'title', 'description', 'location', 'date_time'],
                properties: {
                    category_id: { type: 'integer', example: 1 },
                    type: { type: 'string', enum: ['lost', 'found'], example: 'lost' },
                    title: { type: 'string', maxLength: 255, example: 'Dompet Kulit Coklat' },
                    description: { type: 'string', example: 'Di dalamnya ada KTP atas nama Budi' },
                    location: { type: 'string', maxLength: 255, example: 'Kantin Gedung A Lt. 1' },
                    date_time: { type: 'string', format: 'date-time', example: '2026-06-01T10:30:00.000Z' },
                    image_path: { type: 'string', maxLength: 255, nullable: true }
                }
            },
            ItemUpdateRequest: {
                type: 'object',
                properties: {
                    category_id: { type: 'integer' },
                    type: { type: 'string', enum: ['lost', 'found'] },
                    title: { type: 'string', maxLength: 255 },
                    description: { type: 'string' },
                    location: { type: 'string', maxLength: 255 },
                    date_time: { type: 'string', format: 'date-time' },
                    image_path: { type: 'string', maxLength: 255 },
                    status: {
                        type: 'string',
                        enum: ['pending_verification', 'available', 'returned', 'searching', 'resolved'],
                        description: 'Admin dapat mengubah semua status. User hanya dapat mengubah status lost item ke searching/resolved.'
                    }
                }
            },

            // ─── CLAIM ──────────────────────────────────────────────────
            Claim: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 10 },
                    item_id: { type: 'integer', example: 101 },
                    user_id: { type: 'integer', example: 3 },
                    status: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'pending' },
                    proof_description: { type: 'string', example: 'Di dalam dompet ada KTP atas nama saya' },
                    proof_image_path: { type: 'string', nullable: true },
                    admin_notes: { type: 'string', nullable: true, example: 'Bukti sudah sesuai' },
                    processed_at: { type: 'string', format: 'date-time', nullable: true },
                    item: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', example: 'Dompet Kulit Coklat' },
                            type: { type: 'string', example: 'found' }
                        }
                    },
                    user: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            nim_nip: { type: 'string' },
                            email: { type: 'string' }
                        }
                    }
                }
            },
            ClaimCreateRequest: {
                type: 'object',
                required: ['item_id', 'proof_description'],
                properties: {
                    item_id: { type: 'integer', example: 101 },
                    proof_description: {
                        type: 'string',
                        example: 'Di dalam dompet ada KTP atas nama saya dan kartu mahasiswa'
                    },
                    proof_image_path: { type: 'string', maxLength: 255, nullable: true }
                }
            },
            ClaimUpdateRequest: {
                type: 'object',
                properties: {
                    proof_description: { type: 'string', description: 'Hanya bisa diubah owner jika status masih pending' },
                    proof_image_path: { type: 'string', maxLength: 255 },
                    status: {
                        type: 'string',
                        enum: ['pending', 'approved', 'rejected'],
                        description: 'Hanya admin yang dapat mengubah status klaim'
                    },
                    admin_notes: { type: 'string', description: 'Catatan dari admin (opsional)' }
                }
            },

            // ─── COMMENT ────────────────────────────────────────────────
            Comment: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 55 },
                    item_id: { type: 'integer', example: 101 },
                    user_id: { type: 'integer', example: 3 },
                    text: { type: 'string', example: 'Apakah ini tasmu? Saya lihat yang mirip di kantin.' },
                    created_at: { type: 'string', format: 'date-time' },
                    user: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', example: 'Budi Santoso' }
                        }
                    }
                }
            },
            CommentRequest: {
                type: 'object',
                required: ['text'],
                properties: {
                    text: { type: 'string', example: 'Apakah ini tasmu? Saya lihat yang mirip.' }
                }
            },

            // ─── BOOST ──────────────────────────────────────────────────
            BoostResponse: {
                type: 'object',
                properties: {
                    boosted: { type: 'boolean', example: true },
                    boost_count: { type: 'integer', example: 7 }
                }
            },

            // ─── UPLOAD ─────────────────────────────────────────────────
            UploadResponse: {
                type: 'object',
                properties: {
                    status: { type: 'boolean', example: true },
                    data: {
                        type: 'object',
                        properties: {
                            url: { type: 'string', example: '/uploads/img-1782263481721-187129168.jpg' }
                        }
                    }
                }
            }
        }
    },

    tags: [
        { name: 'Auth', description: 'Registrasi, login, refresh token, dan logout' },
        { name: 'Users', description: 'Profil pengguna yang sedang login' },
        { name: 'Admin - Users', description: 'Manajemen pengguna oleh admin' },
        { name: 'Categories', description: 'Manajemen kategori barang' },
        { name: 'Items', description: 'Laporan barang hilang dan temuan (autentikasi diperlukan)' },
        { name: 'Public', description: 'Endpoint publik — tidak memerlukan autentikasi' },
        { name: 'Claims', description: 'Pengajuan klaim barang temuan' },
        { name: 'Comments', description: 'Komentar pada laporan barang' },
        { name: 'Boosts', description: 'Menandai laporan sebagai mendesak (boost)' },
        { name: 'Upload', description: 'Unggah gambar ke server' }
    ],

    paths: {

        // ================================================================
        // AUTH
        // ================================================================
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Registrasi akun baru',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/RegisterRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Registrasi berhasil',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/UserProfile' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'NIM/NIP atau email sudah terdaftar', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login dan dapatkan access token',
                description: 'Refresh token disimpan sebagai HttpOnly cookie secara otomatis.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/LoginRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Login berhasil',
                        content: {
                            'application/json': {
                                schema: { '$ref': '#/components/schemas/LoginResponse' }
                            }
                        }
                    },
                    401: { description: 'Email/NIM atau password salah', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        '/api/auth/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Perbarui access token menggunakan refresh token (cookie)',
                description: 'Refresh token dibaca otomatis dari HttpOnly cookie yang dikirim browser. Tidak perlu mengirim body apa pun.',
                responses: {
                    200: {
                        description: 'Access token baru berhasil dibuat',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiJ9...' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Refresh token tidak dikirim', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Refresh token tidak valid atau kadaluarsa', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // USERS (CURRENT)
        // ================================================================
        '/api/users/current': {
            get: {
                tags: ['Users'],
                summary: 'Ambil profil pengguna yang sedang login',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Data profil',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/UserProfile' }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Token tidak valid', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            patch: {
                tags: ['Users'],
                summary: 'Perbarui profil pengguna yang sedang login',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/UpdateProfileRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Profil berhasil diperbarui',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/UserProfile' }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Token tidak valid', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        '/api/users/logout': {
            delete: {
                tags: ['Auth'],
                summary: 'Logout dan hapus refresh token',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Logout berhasil',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'string', example: 'Logout berhasil' }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Token tidak valid', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // ADMIN - USER MANAGEMENT
        // ================================================================
        '/api/users': {
            get: {
                tags: ['Admin - Users'],
                summary: '[Admin] Ambil semua data pengguna',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Daftar semua pengguna',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { '$ref': '#/components/schemas/UserProfile' } }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: 'Akses ditolak — bukan admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            post: {
                tags: ['Admin - Users'],
                summary: '[Admin] Buat akun pengguna baru',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/AdminCreateUserRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Pengguna berhasil dibuat',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'integer' },
                                                name: { type: 'string' },
                                                role: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Email atau NIM/NIP sudah terdaftar', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Akses ditolak — bukan admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        '/api/users/{userId}': {
            patch: {
                tags: ['Admin - Users'],
                summary: '[Admin] Perbarui data pengguna',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'userId', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID pengguna' }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/AdminUpdateUserRequest' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Data pengguna berhasil diperbarui' },
                    404: { description: 'Pengguna tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Akses ditolak — bukan admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            delete: {
                tags: ['Admin - Users'],
                summary: '[Admin] Hapus pengguna',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'userId', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID pengguna' }
                ],
                responses: {
                    200: {
                        description: 'Pengguna berhasil dihapus',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'string', example: 'User berhasil dihapus' }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Pengguna tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Akses ditolak — bukan admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // CATEGORIES
        // ================================================================
        '/api/categories': {
            get: {
                tags: ['Categories'],
                summary: 'Ambil semua kategori (publik)',
                responses: {
                    200: {
                        description: 'Daftar kategori',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { '$ref': '#/components/schemas/Category' } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Categories'],
                summary: '[Admin] Tambah kategori baru',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/CategoryRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Kategori berhasil dibuat',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Category' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Nama kategori sudah ada', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Akses ditolak — bukan admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        '/api/categories/{categoryId}': {
            get: {
                tags: ['Categories'],
                summary: 'Ambil satu kategori berdasarkan ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'categoryId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }
                ],
                responses: {
                    200: {
                        description: 'Detail kategori',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Category' }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Kategori tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            patch: {
                tags: ['Categories'],
                summary: '[Admin] Perbarui nama kategori',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'categoryId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/CategoryRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Kategori berhasil diperbarui',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Category' }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Kategori tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Akses ditolak — bukan admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // ITEMS (AUTH REQUIRED)
        // ================================================================
        '/api/items': {
            get: {
                tags: ['Items'],
                summary: 'Ambil daftar laporan barang dengan filter dan pagination',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Nomor halaman' },
                    { name: 'size', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 }, description: 'Jumlah item per halaman' },
                    { name: 'type', in: 'query', schema: { type: 'string', enum: ['lost', 'found'] }, description: 'Filter berdasarkan jenis laporan' },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending_verification', 'available', 'returned', 'searching', 'resolved'] }, description: 'Filter berdasarkan status' },
                    { name: 'category_id', in: 'query', schema: { type: 'integer' }, description: 'Filter berdasarkan kategori' },
                    { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Pencarian kata kunci pada judul dan deskripsi' },
                    { name: 'user_id', in: 'query', schema: { type: 'integer' }, description: 'Filter laporan milik user tertentu' },
                    { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['created_at', 'boosts'] }, description: 'Urutan tampilan' }
                ],
                responses: {
                    200: {
                        description: 'Daftar laporan barang',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { '$ref': '#/components/schemas/Item' } },
                                        meta: { '$ref': '#/components/schemas/PaginationMeta' }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Token tidak valid', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            post: {
                tags: ['Items'],
                summary: 'Buat laporan barang hilang atau temuan',
                description: '- `type: lost` → status otomatis `searching`\n- `type: found` → status otomatis `pending_verification` (menunggu verifikasi admin)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/ItemCreateRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Laporan berhasil dibuat',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Item' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Data tidak valid', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Kategori tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    401: { description: 'Token tidak valid', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        '/api/items/{itemId}': {
            get: {
                tags: ['Items'],
                summary: 'Ambil detail satu laporan (berdasarkan ID atau slug)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'itemId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID numerik atau slug barang', example: '101' }
                ],
                responses: {
                    200: {
                        description: 'Detail laporan barang',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Item' }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Barang tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            patch: {
                tags: ['Items'],
                summary: 'Perbarui laporan barang',
                description: '- Owner hanya dapat mengubah field konten.\n- Admin dapat mengubah status (termasuk memverifikasi `pending_verification → available`).\n- Non-owner/non-admin mendapat 403.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' }, example: 101 }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/ItemUpdateRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Laporan berhasil diperbarui',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Item' }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: 'Bukan owner atau admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Barang tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            delete: {
                tags: ['Items'],
                summary: 'Hapus laporan barang',
                description: 'Hanya owner atau admin yang dapat menghapus.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' }, example: 101 }
                ],
                responses: {
                    200: {
                        description: 'Laporan berhasil dihapus',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'string', example: 'Barang berhasil dihapus' }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: 'Bukan owner atau admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Barang tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // PUBLIC ITEMS
        // ================================================================
        '/api/public/items': {
            get: {
                tags: ['Public'],
                summary: 'Ambil daftar laporan barang (tanpa autentikasi)',
                description: 'Item dengan status `pending_verification` tidak ditampilkan.',
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'size', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
                    { name: 'type', in: 'query', schema: { type: 'string', enum: ['lost', 'found'] } },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['available', 'returned', 'searching', 'resolved'] } },
                    { name: 'category_id', in: 'query', schema: { type: 'integer' } },
                    { name: 'q', in: 'query', schema: { type: 'string' } },
                    { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['created_at', 'boosts'] } }
                ],
                responses: {
                    200: {
                        description: 'Daftar laporan publik',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { '$ref': '#/components/schemas/Item' } },
                                        meta: { '$ref': '#/components/schemas/PaginationMeta' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        '/api/public/items/{itemId}': {
            get: {
                tags: ['Public'],
                summary: 'Ambil detail laporan (tanpa autentikasi)',
                parameters: [
                    { name: 'itemId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID atau slug barang', example: 'dompet-kulit-coklat' }
                ],
                responses: {
                    200: {
                        description: 'Detail laporan',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Item' }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Barang tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        '/api/public/items/{itemId}/comments': {
            get: {
                tags: ['Public'],
                summary: 'Ambil semua komentar pada laporan (tanpa autentikasi)',
                parameters: [
                    { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' }, example: 101 }
                ],
                responses: {
                    200: {
                        description: 'Daftar komentar',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { '$ref': '#/components/schemas/Comment' } }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Barang tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // CLAIMS
        // ================================================================
        '/api/claims': {
            get: {
                tags: ['Claims'],
                summary: 'Ambil daftar klaim',
                description: '- **User biasa**: hanya melihat klaim yang mereka ajukan atau klaim pada barang yang mereka laporkan.\n- **Admin**: melihat semua klaim.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'size', in: 'query', schema: { type: 'integer', default: 10 } },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } },
                    { name: 'item_id', in: 'query', schema: { type: 'integer' }, description: 'Filter klaim untuk barang tertentu' }
                ],
                responses: {
                    200: {
                        description: 'Daftar klaim',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { '$ref': '#/components/schemas/Claim' } },
                                        meta: { '$ref': '#/components/schemas/PaginationMeta' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Claims'],
                summary: 'Ajukan klaim untuk barang temuan',
                description: 'Hanya barang dengan `type: found` yang dapat diklaim. Tidak dapat mengklaim barang milik sendiri.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/ClaimCreateRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Klaim berhasil diajukan',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Claim' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Klaim sudah ada / barang bukan tipe found / sudah dikembalikan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Barang tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        '/api/claims/{claimId}': {
            get: {
                tags: ['Claims'],
                summary: 'Ambil detail klaim berdasarkan ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'claimId', in: 'path', required: true, schema: { type: 'integer' }, example: 10 }
                ],
                responses: {
                    200: {
                        description: 'Detail klaim',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Claim' }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Klaim tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            patch: {
                tags: ['Claims'],
                summary: 'Perbarui klaim',
                description: '- **Owner** (status pending): dapat mengubah `proof_description` dan `proof_image_path`.\n- **Admin**: dapat mengubah `status` menjadi `approved` atau `rejected`.\n  - Jika `approved`, status barang otomatis berubah menjadi `returned`.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'claimId', in: 'path', required: true, schema: { type: 'integer' }, example: 10 }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/ClaimUpdateRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Klaim berhasil diperbarui',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Claim' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Klaim sudah diproses / tidak dapat mengubah bukti', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Bukan owner atau admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Klaim tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            delete: {
                tags: ['Claims'],
                summary: 'Hapus klaim',
                description: '- Owner dapat menghapus klaim selama masih berstatus `pending`.\n- Admin dapat menghapus klaim kapan saja.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'claimId', in: 'path', required: true, schema: { type: 'integer' }, example: 10 }
                ],
                responses: {
                    200: {
                        description: 'Klaim berhasil dihapus',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'string', example: 'Klaim berhasil dihapus' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Klaim sudah disetujui, tidak dapat dihapus', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Bukan owner atau admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Klaim tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // COMMENTS
        // ================================================================
        '/api/items/{itemId}/comments': {
            post: {
                tags: ['Comments'],
                summary: 'Tambah komentar pada laporan barang',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' }, example: 101 }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/CommentRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Komentar berhasil ditambahkan',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Comment' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Teks komentar kosong', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Barang tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        '/api/comments/{commentId}': {
            patch: {
                tags: ['Comments'],
                summary: 'Perbarui komentar (hanya owner)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'commentId', in: 'path', required: true, schema: { type: 'integer' }, example: 55 }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/CommentRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Komentar berhasil diperbarui',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/Comment' }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: 'Bukan owner komentar', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Komentar tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            },
            delete: {
                tags: ['Comments'],
                summary: 'Hapus komentar (owner atau admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'commentId', in: 'path', required: true, schema: { type: 'integer' }, example: 55 }
                ],
                responses: {
                    200: {
                        description: 'Komentar berhasil dihapus',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { type: 'string', example: 'Komentar berhasil dihapus' }
                                    }
                                }
                            }
                        }
                    },
                    403: { description: 'Bukan owner atau admin', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Komentar tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // BOOSTS
        // ================================================================
        '/api/items/{itemId}/boost': {
            post: {
                tags: ['Boosts'],
                summary: 'Toggle boost pada laporan (tambah atau hapus)',
                description: 'Panggil endpoint ini dua kali dengan user yang sama untuk menambah lalu menghapus boost.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'itemId', in: 'path', required: true, schema: { type: 'integer' }, example: 101 }
                ],
                responses: {
                    200: {
                        description: 'Status boost setelah toggle',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        data: { '$ref': '#/components/schemas/BoostResponse' }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Barang tidak ditemukan', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    401: { description: 'Token tidak valid', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // UPLOAD
        // ================================================================
        '/api/upload': {
            post: {
                tags: ['Upload'],
                summary: 'Unggah gambar ke server',
                description: 'Mengembalikan URL gambar yang dapat disimpan ke field `image_path` pada item atau klaim.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['image'],
                                properties: {
                                    image: {
                                        type: 'string',
                                        format: 'binary',
                                        description: 'File gambar (maks. 5MB · JPG, PNG, GIF)'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Gambar berhasil diunggah',
                        content: {
                            'application/json': {
                                schema: { '$ref': '#/components/schemas/UploadResponse' }
                            }
                        }
                    },
                    400: { description: 'File tidak valid atau terlalu besar', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } },
                    401: { description: 'Token tidak valid', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },

        // ================================================================
        // HEALTH
        // ================================================================
        '/ping': {
            get: {
                tags: ['Public'],
                summary: 'Health check',
                responses: {
                    200: {
                        description: 'Server aktif',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'boolean', example: true },
                                        message: { type: 'string', example: 'pong' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
