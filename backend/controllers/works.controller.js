// /backend/controllers/works.controller.js

const db = require('../models');
const { Op } = require('sequelize');
const Work = db.Work;
const WorkImage = db.WorkImage; 

// **********************************************
// ********** 1. دالة findAll (جلب الجميع) **********
// **********************************************
exports.findAll = async (req, res) => {
    const { filter, search } = req.query;
    let whereClause = {};

    if (filter && filter !== 'all') {
        switch (filter) {
            case 'featured': whereClause.is_featured = true; break;
            case 'festival': whereClause.is_festival_work = true; break;
            case 'news': whereClause.is_news = true; break;
            case 'timeline': whereClause.is_timeline_event = true; break;
            case 'ticker': whereClause.is_ticker = true; break;
            case 'article': whereClause.is_article = true; break;
        }
    }

    if (search) {
        whereClause[Op.or] = [
            { title_ar: { [Op.like]: `%${search}%` } },
            { summary_ar: { [Op.like]: `%${search}%` } },
        ];
    }
    
    const order = [['publication_date', 'DESC'], ['id', 'DESC']];

    try {
        const works = await Work.findAll({
            where: whereClause,
            // التأكد من جلب الصور المرتبطة
            include: [{ model: WorkImage, as: 'images' }], 
            order: order,
        });

        res.status(200).send(works);
    } catch (error) {
        console.error("Error fetching works:", error);
        res.status(500).send({ message: 'حدث خطأ أثناء جلب المنشورات.', error: error.message });
    }
};

// **********************************************
// ********** 2. دالة createWork (الإضافة) **********
// **********************************************
exports.createWork = async (req, res) => {
    try {
        const { 
            title_ar, summary_ar, content_ar, title_en, summary_en, content_en, 
            title_de, summary_de, content_de, production_year, publication_date, 
            facebook_link, instagram_link 
        } = req.body;

        if (!title_ar || !publication_date) {
            return res.status(400).send({ message: 'العنوان العربي وتاريخ النشر حقلان إلزاميان.' });
        }
        
        const is_featured = parseInt(req.body.is_featured) || 0;
        const is_festival_work = parseInt(req.body.is_festival_work) || 0;
        const is_news = parseInt(req.body.is_news) || 0;
        const is_timeline_event = parseInt(req.body.is_timeline_event) || 0;
        const is_ticker = parseInt(req.body.is_ticker) || 0;
        const is_article = parseInt(req.body.is_article) || 0;
      
        let coverImageUrl = null;
        if (req.files && req.files['coverImage'] && req.files['coverImage'][0]) {
            coverImageUrl = '/uploads/works/' + req.files['coverImage'][0].filename;
        }

        // 1. إنشاء المنشور
        const newWork = await Work.create({
            title_ar, summary_ar, content_ar,
            title_en, summary_en, content_en,
            title_de, summary_de, content_de,
            production_year: production_year || null,
            publication_date,
            facebook_link, instagram_link,
            is_featured, is_festival_work, is_news, is_timeline_event,is_ticker,is_article,
            cover_image_url: coverImageUrl,
            adminId: req.adminId
        });

        // 2. إضافة الصور الإضافية
        if (req.files && req.files['additionalImages']) {
            const imagePromises = req.files['additionalImages'].map(file => {
                return WorkImage.create({
                    work_id: newWork.id,
                    image_url: '/uploads/works/' + file.filename,
                    alt_ar: title_ar,
                    alt_en: title_en || title_ar, // fallback
                    alt_de: title_de || title_ar
                });
            });
            await Promise.all(imagePromises);
        }
        
        res.status(201).send({ message: 'تم إضافة المنشور وحفظ الصور بنجاح.', work: newWork });

    } catch (error) {
        console.error("Error inside createWork:", error);
        res.status(500).send({ message: 'فشل حفظ البيانات.', errorDetails: error.message });
    }
};

// **********************************************
// ********** 3. دالة findOne (جلب مفرد) **********
// **********************************************
exports.findOne = async (req, res) => {
    const id = req.params.id;
    try {
        const work = await Work.findByPk(id, {
            // التأكد من جلب الصور المرتبطة
            include: [{ model: WorkImage, as: 'images' }] 
        });

        if (work) {
            res.send(work);
        } else {
            res.status(404).send({ message: `لا يوجد منشور بالمعرف: ${id}.` });
        }
    } catch (error) {
        res.status(500).send({ message: "حدث خطأ أثناء جلب المنشور." });
    }
};

// **********************************************
// ********** 4. دالة updateWork (التعديل) **********
// **********************************************
/*exports.updateWork = async (req, res) => {
    const id = req.params.id;

    try {
        const { 
            title_ar, summary_ar, content_ar, title_en, summary_en, content_en, 
            title_de, summary_de, content_de, production_year, publication_date, 
            facebookPostLink, instagramPostLink 
        } = req.body;

        let updateData = {
            title_ar, summary_ar, content_ar,
            title_en, summary_en, content_en,
            title_de, summary_de, content_de,
            production_year: production_year || null,
            publication_date,
            facebookPostLink, instagramPostLink,
            is_featured: parseInt(req.body.is_featured) || 0,
            is_festival_work: parseInt(req.body.is_festival_work) || 0,
            is_news: parseInt(req.body.is_news) || 0,
            is_timeline_event: parseInt(req.body.is_timeline_event) || 0,
        };

        if (req.files && req.files['coverImage']) {
            updateData.cover_image_url = '/uploads/works/' + req.files['coverImage'][0].filename;
        }

        // 1. تحديث الجدول الرئيسي
        await Work.update(updateData, { where: { id: id } });

        // 2. التعامل مع صور المعرض (WorkImage)
        
        // أ) إضافة الصور الجديدة (مع إضافة catch لتحديد سبب الفشل)
       if (req.files && req.files['additionalImages']) {
            const newImagesPromises = req.files['additionalImages'].map(file => {
                return WorkImage.create({
                    work_id: id,
                    image_url: '/uploads/works/' + file.filename,
                    alt_ar: title_ar,
                    alt_en: title_en || title_ar,
                    alt_de: title_de || title_ar
                })
                .then(newImage => {
                    // 🛑 إذا وصلت إلى هنا، فالحفظ نجح!
                    console.log(`✅ Success: Image ${newImage.id} saved for work ${id}`);
                    return newImage; // أعد الكائن الجديد للمصفوفة
                })
                .catch(dbError => {
                    // 🛑 هنا سيتم التقاط أي خطأ في DB
                    console.error("🚨 CRITICAL DB ERROR:", dbError.message);
                    throw new Error(`فشل حفظ الصورة في قاعدة البيانات: ${dbError.message}`);
                });
            });
            await Promise.all(newImagesPromises);
        }

        // ب) حذف الصور المحذوفة
        let remainingUrls = [];

        if (req.body.remaining_images_urls) {
            try {
                // محاولة تحليل البيانات القادمة كـ JSON، وتصفية أي قيم فارغة
                const parsedUrls = JSON.parse(req.body.remaining_images_urls);
                remainingUrls = Array.isArray(parsedUrls) 
                    ? parsedUrls.filter(url => url && typeof url === 'string') 
                    : [];
            } catch (e) {
                console.warn(`Work ${id}: Failed to parse remaining_images_urls. Assuming empty list.`);
                remainingUrls = []; 
            }
        }
        
        // منطق الحذف: احذف جميع السجلات المرتبطة بهذا العمل، باستثناء تلك التي تم إرسال روابطها في القائمة المتبقية.
        await WorkImage.destroy({
            where: {
                work_id: id,
                image_url: { [Op.notIn]: remainingUrls } 
            }
        });

        res.send({ message: 'تم تحديث المنشور والصور بنجاح.' });

    } catch (error) {
        console.error("Error updating work:", error);
        // إرجاع تفاصيل الخطأ في قاعدة البيانات إن وجد
        res.status(500).send({ message: 'حدث خطأ أثناء التحديث.', errorDetails: error.message });
    }
};
*/
// /backend/controllers/works.controller.js - دالة updateWork (النسخة النهائية مع عزل المشكلة)

// /backend/controllers/works.controller.js - دالة updateWork (النسخة النهائية الجديدة)

exports.updateWork = async (req, res) => {
    const id = req.params.id;

    try {
        // 0. التحقق من وجود المنشور
        const existingWork = await Work.findByPk(id);
        if (!existingWork) {
            return res.status(404).send({ message: `لا يمكن تحديث المنشور ذو المعرف ${id}. غير موجود.` });
        }
        
        const { 
            title_ar, summary_ar, content_ar, title_en, summary_en, content_en, 
            title_de, summary_de, content_de, production_year, publication_date, 
            facebook_link, instagram_link 
        } = req.body;

        let updateData = {
            title_ar, summary_ar, content_ar,
            title_en, summary_en, content_en,
            title_de, summary_de, content_de,
            production_year: production_year || null,
            publication_date,
            facebook_link, instagram_link,
            is_featured: parseInt(req.body.is_featured) || 0,
            is_festival_work: parseInt(req.body.is_festival_work) || 0,
            is_news: parseInt(req.body.is_news) || 0,
            is_timeline_event: parseInt(req.body.is_timeline_event) || 0,
            is_ticker : parseInt(req.body.is_ticker) || 0,
            is_article : parseInt(req.body.is_article) || 0,

        };

        if (req.files && req.files['coverImage']) {
            updateData.cover_image_url = '/uploads/works/' + req.files['coverImage'][0].filename;
        }

        // 1. تحديث الجدول الرئيسي
        await Work.update(updateData, { where: { id: id } });

        // 2. التعامل مع صور المعرض (WorkImage) - المنطق الجديد

        // أ) حذف جميع الصور القديمة المرتبطة بالعمل
        await WorkImage.destroy({
            where: { work_id: id } 
        });

        // ب) إضافة جميع الصور الجديدة/المتبقية دفعة واحدة
        // (Multer يُرسل الملفات الجديدة فقط في additionalImages)
        if (req.files && req.files['additionalImages']) {
            const newImagesPromises = req.files['additionalImages'].map(file => {
                return WorkImage.create({
                    work_id: id,
                    image_url: '/uploads/works/' + file.filename,
                    alt_ar: title_ar,
                    alt_en: title_en || title_ar,
                    alt_de: title_de || title_ar
                });
            });
            await Promise.all(newImagesPromises);
        }

        res.send({ message: 'تم تحديث المنشور والصور بنجاح.' });

    } catch (error) {
        console.error("Error updating work:", error);
        res.status(500).send({ message: 'حدث خطأ أثناء التحديث.', errorDetails: error.message });
    }
};
// **********************************************
// ********** 5. دالة deleteWork (الحذف) **********
// **********************************************
exports.deleteWork = async (req, res) => {
    const id = req.params.id;

    try {
        // الحذف اليدوي للصور أولاً (للأمان)
        await WorkImage.destroy({ where: { work_id: id } });
        const num = await Work.destroy({ where: { id: id } });

        if (num == 1) {
            res.send({ message: "تم حذف المنشور بنجاح!" });
        } else {
            res.status(404).send({ message: `لا يمكن حذف المنشور ذو المعرف ${id}.` });
        }
    } catch (error) {
        res.status(500).send({ message: "حدث خطأ أثناء الحذف." });
    }
};