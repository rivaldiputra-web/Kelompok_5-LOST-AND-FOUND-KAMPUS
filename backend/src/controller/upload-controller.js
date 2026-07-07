const upload = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: false,
                errors: "File gambar tidak disediakan atau format tidak didukung"
            });
        }
        
        const host = req.get('host');
        const protocol = req.protocol;
        // Hasilkan link absolut agar frontend dapat langsung merender gambar
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        
        res.status(200).json({
            status: true,
            data: {
                url: fileUrl,
                filename: req.file.filename
            }
        });
    } catch (e) {
        next(e);
    }
};

export default {
    upload
};
