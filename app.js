import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyC7zHuH8LK-yQAKG-Nm7dh31fXtVLxuCLM", authDomain: "sharqia-81030.firebaseapp.com", projectId: "sharqia-81030", storageBucket: "sharqia-81030.firebasestorage.app", messagingSenderId: "581888625195", appId: "1:581888625195:web:1667ba1e439e8e6c1fb86e" };
const app = initializeApp(firebaseConfig); const db = getFirestore(app); const auth = getAuth(app);

const COLLECTION_NAME = "listings_v2"; 
const DUMMY_PUBLISHER = { displayName: "وسيط السوق", phoneNumber: "01206244875", photoURL: "https://cdn-icons-png.flaticon.com/512/609/609803.png" };

let state = { user: null, userProfile: null, listings:[], filesToUpload:[], editingId: null, existingImages:[], regImage: null, chatId: null, chatStep: 0, tempName: '', activeAdminChat: null, isAdmin: false, welcomeSent: false, currentFilter: 'all', visibleLimit: 8, lightboxIndex: 0, activeDetailsId: null, currentDetailIndex: 0, publisherCache: {} };

let reviewsData =[];
let currentReviewPage = 0;
const REVIEWS_PER_PAGE = 5;

const ALL_AMENITIES =["غاز طبيعي", "كهرباء", "مياه", "أسانسير", "واي فاي", "حمام سباحة", "حديقة", "جراج", "أمن وحراسة", "كاميرات مراقبة", "مطبخ أمريكاني", "غرفة خادمة", "مسموح بالحيوانات", "على ناصية"];
const LAND_AMENITIES =["كهرباء", "مياه", "غاز طبيعي", "على ناصية"];
const CAT_MAP = { 'apartment': 'شقق', 'villa': 'فلل', 'chalet': 'شاليهات', 'office': 'مكاتب', 'shop': 'محلات', 'land': 'أراضي', 'building': 'عماير', 'warehouse': 'مخازن' };
const CAT_KEYWORDS = { 'شقة': 'apartment', 'شقق': 'apartment', 'فيلا': 'villa', 'فلل': 'villa', 'شالية': 'chalet', 'شاليهات': 'chalet', 'مكتب': 'office', 'مكاتب': 'office', 'محل': 'shop', 'محلات': 'shop', 'ارض': 'land', 'اراضي': 'land', 'عمارة': 'building', 'عماير': 'building', 'مخزن': 'warehouse', 'مخازن': 'warehouse' };

const CATEGORIES_DATA =[
    { id: 'apartment', name: 'شقق', img: 'https://images.pexels.com/photos/439227/pexels-photo-439227.jpeg?auto=compress&cs=tinysrgb&w=300&q=50' },
    { id: 'villa', name: 'فلل', img: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=300&q=50' },
    { id: 'chalet', name: 'شاليهات', img: 'https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg?auto=compress&cs=tinysrgb&w=300&q=50' },
    { id: 'office', name: 'مكاتب', img: 'https://images.pexels.com/photos/1957478/pexels-photo-1957478.jpeg?auto=compress&cs=tinysrgb&w=300&q=50' },
    { id: 'shop', name: 'محلات', img: 'https://images.pexels.com/photos/3914755/pexels-photo-3914755.jpeg?auto=compress&cs=tinysrgb&w=300&q=50' },
    { id: 'land', name: 'أراضي', img: 'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&cs=tinysrgb&w=300&q=50' },
    { id: 'building', name: 'عماير', img: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=300&q=50' },
    { id: 'warehouse', name: 'مخازن', img: 'https://images.pexels.com/photos/221047/pexels-photo-221047.jpeg?auto=compress&cs=tinysrgb&w=300&q=50' }
];

const EGYPT_LOCATIONS = { "الشرقية":["الزقازيق", "العاشر من رمضان", "منيا القمح", "بلبيس", "مشتول السوق", "القنايات", "أبو حماد", "القرين", "ههيا", "أبو كبير", "فاقوس", "الصالحية الجديدة", "الإبراهيمية", "ديرب نجم", "كفر صقر", "أولاد صقر", "الحسينية", "صان الحجر", "منشأة أبو عمر"], "القاهرة":["مدينة نصر", "مصر الجديدة", "المعادي", "التجمع الخامس", "الرحاب", "مدينتي", "الشروق", "العبور", "المقطم", "الزيتون", "حدائق القبة", "شبرا", "وسط البلد", "المنيل", "الزمالك", "المهندسين", "الدقي", "العجوزة"], "الجيزة":["6 أكتوبر", "الشيخ زايد", "الهرم", "فيصل", "المهندسين", "الدقي", "العجوزة", "إمبابة", "الوراق", "بولاق الدكرور", "العمرانية", "المنيب"] };

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = CATEGORIES_DATA.map(c => `
        <div onclick="openCategory('${c.id}', '${c.name}')" class="relative h-24 md:h-32 rounded-xl overflow-hidden cursor-pointer active:scale-95 bg-slate-300 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <img src="${c.img}" class="absolute inset-0 w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/40"></div>
            <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-white font-black text-[13px] md:text-sm tracking-wider px-3 py-1 bg-black/50 rounded-lg">${c.name}</span>
            </div>
        </div>
    `).join('');
}

window.addEventListener('popstate', (e) => {
    if (!document.getElementById('lightbox').classList.contains('hidden')) {
        closeLightbox(); return;
    }
    const openModals = Array.from(document.querySelectorAll('.modal-overlay:not(.hidden)'));
    if (openModals.length > 0) {
        if(!document.getElementById('details-modal').classList.contains('hidden')) {
            closeDetails(true); 
        } else {
            openModals.forEach(m => m.classList.add('hidden'));
            document.body.style.overflow = '';
        }
        return;
    }
    if (document.getElementById('home-view').classList.contains('hidden')) {
        openHome(true); 
    }
});

window.openHome = (isHistoryBack = false) => {
    document.getElementById('home-view').classList.remove('hidden');
    document.getElementById('listings-view').classList.add('hidden');
    document.getElementById('cat-filter-wrapper').classList.remove('hidden'); 
    document.getElementById('filter-panel').classList.remove('open');
    window.scrollTo({top:0, behavior:'smooth'});
    if(!isHistoryBack) history.pushState({view: 'home'}, '', window.location.pathname);
};

window.openCategory = (catId, catName) => {
    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('listings-view').classList.remove('hidden');
    document.getElementById('listings-view-title').innerText = catName;

    const catSelect = document.getElementById('filter-cat');
    document.getElementById('cat-filter-wrapper').classList.add('hidden');
    document.getElementById('filter-panel').classList.remove('open');

    resetFiltersBase(); 
    catSelect.value = catId;
    performSearch(false);
    window.scrollTo({top:0, behavior:'smooth'});
    history.pushState({view: 'category', id: catId}, '', window.location.pathname);
};

function resetFiltersBase() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').selectedIndex = 0;
    document.getElementById('filter-gov').selectedIndex = 0;
    document.getElementById('filter-city').innerHTML = '<option value="">كل المراكز</option>';
    document.getElementById('filter-min-price').value = '';
    document.getElementById('filter-max-price').value = '';
    state.currentFilter = 'all';
    state.visibleLimit = 8;
}

window.resetFilters = () => {
    const currentCat = document.getElementById('filter-cat').value;
    resetFiltersBase();
    if(document.getElementById('cat-filter-wrapper').classList.contains('hidden')) {
        document.getElementById('filter-cat').value = currentCat;
    } else {
        document.getElementById('filter-cat').selectedIndex = 0;
    }
    performSearch(false);
};

function checkAndOpenUrlProperty() {
    const urlParams = new URLSearchParams(window.location.search);
    const openId = urlParams.get('id');
    if (openId && state.activeDetailsId !== openId) {
        const exists = state.listings.find(i => i.id === openId);
        if(exists) { setTimeout(() => { openDetails(openId); }, 200); }
    }
}

function loadCachedData() { const cached = localStorage.getItem('souq_listings'); if(cached) { try { state.listings = JSON.parse(cached); state.listings.sort((a,b) => (a.isPinned ? -1 : 1)); updateFeaturedSlider(); performSearch(true); document.body.classList.add('app-loaded'); document.getElementById('splash-screen').classList.add('hidden-splash'); checkAndOpenUrlProperty(); } catch(e) { console.log('Cache error', e); } } }

setTimeout(() => { document.getElementById('splash-screen').classList.add('hidden-splash'); document.body.classList.add('app-loaded'); renderCategories(); }, 5000);

let featuredDirection = -1;
let featuredAutoScroll; 

function startAutoScroll() {
    clearInterval(featuredAutoScroll);
    const slider = document.getElementById('featured-slider');
    if (!slider || slider.children.length <= 1) return;

    featuredAutoScroll = setInterval(() => {
        window.scrollFeatured(featuredDirection, false);
    }, 3000); 
}

function updateFeaturedSlider() {
    const featuredList = state.listings.filter(i => i.isPinned);
    const container = document.getElementById('featured-slider');
    const section = document.getElementById('featured-section');
    if(featuredList.length === 0) {
        section.classList.add('hidden');
        clearInterval(featuredAutoScroll);
    } else {
        section.classList.remove('hidden');
        container.innerHTML = featuredList.map(item => {
            return `<div class="w-full flex-[0_0_100%] snap-center shrink-0">${createCard(item, 'feat')}</div>`;
        }).join('');
        lucide.createIcons({ root: container });

        featuredDirection = -1; 
        startAutoScroll();
        container.onmouseenter = () => clearInterval(featuredAutoScroll);
        container.onmouseleave = startAutoScroll;
        container.ontouchstart = () => clearInterval(featuredAutoScroll);
        container.ontouchend = startAutoScroll;
    }
}

window.scrollFeatured = (dir, resetTimer = true) => { 
    const slider = document.getElementById('featured-slider'); 
    if (!slider || slider.children.length <= 1) return;

    const cardWidth = slider.firstElementChild.offsetWidth;
    const maxScroll = slider.scrollWidth - slider.clientWidth;

    if (dir !== undefined && resetTimer) {
        featuredDirection = dir;
    }

    slider.scrollBy({ left: featuredDirection * cardWidth, behavior: 'smooth' });

    setTimeout(() => {
        const currentScroll = Math.abs(slider.scrollLeft);
        if (currentScroll >= maxScroll - 10) {
            featuredDirection = 1; 
        } else if (currentScroll <= 10) {
            featuredDirection = -1; 
        }
    }, 400);

    if(resetTimer) startAutoScroll();
}

function loadReviews() {
    onSnapshot(query(collection(db, "reviews")), (snap) => {
        reviewsData =[];
        snap.forEach(doc => reviewsData.push({ id: doc.id, ...doc.data() }));
        reviewsData.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        renderReviews();
    });
}

function renderReviews() {
    const container = document.getElementById('reviews-container');
    if (reviewsData.length === 0) {
        container.innerHTML = '<div class="flex justify-center items-center h-20 text-slate-400 text-xs font-bold">لا توجد تقييمات بعد. كن أول من يضيف تقييماً!</div>';
        return;
    }

    const startIndex = currentReviewPage * REVIEWS_PER_PAGE;
    const pageReviews = reviewsData.slice(startIndex, startIndex + REVIEWS_PER_PAGE);

    container.innerHTML = pageReviews.map(r => `
        <div class="bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-800 dark:border-emerald-600 animate-pop">
            <div class="flex justify-between items-center mb-1.5">
                <div class="flex items-center gap-1.5">
                    <img src="${r.userPhoto || 'https://cdn-icons-png.flaticon.com/512/609/609803.png'}" class="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-600">
                    <span class="font-black text-[11px] text-slate-800 dark:text-white">${r.userName}</span>
                </div>
                <span class="text-[8px] font-bold text-slate-500 dark:text-slate-400">${timeAgo(r.createdAt)}</span>
            </div>
            <div class="text-[10px] text-slate-800 dark:text-slate-300 font-bold leading-relaxed bg-slate-200 dark:bg-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-700 whitespace-pre-wrap">${r.text}</div>
        </div>
    `).join('');
}

window.changeReviewPage = (dir) => {
    const maxPage = Math.ceil(reviewsData.length / REVIEWS_PER_PAGE) - 1;
    if (maxPage < 0) return;
    currentReviewPage += dir;
    if (currentReviewPage < 0) currentReviewPage = maxPage; 
    if (currentReviewPage > maxPage) currentReviewPage = 0; 
    renderReviews();
};

window.openReviewModal = () => {
    if(!state.user || state.user.isAnonymous) {
        showToast('يجب تسجيل الدخول لنشر تقييم', 'e');
        toggleModal('auth-modal');
        return;
    }
    document.getElementById('review-text').value = '';
    toggleModal('review-modal');
};

window.submitReview = async () => {
    const text = document.getElementById('review-text').value.trim();
    if(!text) return showToast('يرجى كتابة التقييم', 'e');

    const btn = document.getElementById('btn-submit-review');
    btn.disabled = true; btn.innerText = 'جاري النشر...';

    try {
        const photoUrl = state.userProfile?.photoURL || 'https://cdn-icons-png.flaticon.com/512/609/609803.png';
        const name = state.userProfile?.displayName || 'مستخدم';
        await addDoc(collection(db, "reviews"), {
            userId: state.user.uid,
            userName: name,
            userPhoto: photoUrl,
            text: text,
            createdAt: serverTimestamp()
        });
        showToast('تم نشر التقييم بنجاح');
        toggleModal('review-modal');
        currentReviewPage = 0; 
    } catch(e) {
        console.error(e);
        showToast('حدث خطأ أثناء النشر', 'e');
    } finally {
        btn.disabled = false; btn.innerText = 'نشر التقييم';
    }
};

loadCachedData();
renderCategories();

onAuthStateChanged(auth, async (u) => { 
    if(u) { 
        state.user = u;
        if(!u.isAnonymous) {
            const userDoc = await getDoc(doc(db, "users", u.uid));
            if(userDoc.exists()) {
                state.userProfile = userDoc.data();
                if(state.userProfile.isBlocked) { document.body.innerHTML = `<div style="display:flex; flex-direction:column; height:100vh; align-items:center; justify-content:center; background-color:#0f172a; color:#ef4444; text-align:center; padding:20px;"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg><h1 style="font-size:24px; font-weight:bold; margin-bottom:10px;">عذراً، تم حظر هذا الحساب!</h1></div>`; return; }
                if(state.userProfile.phoneNumber === '+201206244875' || state.userProfile.isAdmin) { state.isAdmin = true; document.getElementById('btn-admin-top').classList.remove('hidden'); } else { state.isAdmin = false; document.getElementById('btn-admin-top').classList.add('hidden'); }
                updateHeader();
            }
        } else { state.userProfile = null; state.isAdmin = false; document.getElementById('btn-admin-top').classList.add('hidden'); updateHeader(); }
        loadListings(); loadReviews(); checkUserChat(); renderAmenities(ALL_AMENITIES); initLocations();
    } else { signInAnonymously(auth).catch(console.error); }
});

window.handleProfileClick = () => { if(!state.user || state.user.isAnonymous) toggleModal('auth-modal'); };
window.switchAuthMode = (mode) => {['login','register'].forEach(m => { document.getElementById(`form-${m}`).classList.add('hidden'); document.getElementById(`tab-${m}`).className = 'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 dark:text-slate-400 border dark:border-slate-700 border-transparent'; }); document.getElementById(`form-${mode}`).classList.remove('hidden'); document.getElementById(`tab-${mode}`).className = 'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-800 shadow text-emerald-600 dark:text-white border dark:border-slate-600'; };
window.formatPhone = (input) => { let val = input.value.replace(/\D/g, ''); if(val.startsWith('0')) val = val.substring(1); input.value = val; };
window.previewProfileImage = async (input) => { if(input.files && input.files[0]) { const originalFile = input.files[0]; const instantUrl = URL.createObjectURL(originalFile); const img = document.getElementById('reg-img-preview'); img.src = instantUrl; img.classList.remove('hidden'); document.getElementById('reg-img-placeholder').classList.add('hidden'); state.regImage = await compressImage(originalFile, 300); } };
window.registerUser = async () => { const n=document.getElementById('reg-name').value, p=document.getElementById('reg-phone').value, w=document.getElementById('reg-pass').value; if(!n||!p||!w||!state.regImage)return showToast('البيانات ناقصة','e'); const btn=document.getElementById('btn-register'); btn.innerText='جاري الإنشاء...'; btn.disabled=true; try{ const photoURL=await uploadToCloudinary(state.regImage); const cred=await createUserWithEmailAndPassword(auth, `0${p}@souq.com`, w); const ud={uid:cred.user.uid,displayName:n,phoneNumber:`+20${p}`,photoURL:photoURL,createdAt:serverTimestamp()}; await setDoc(doc(db,"users",cred.user.uid),ud); state.userProfile=ud; updateHeader(); toggleModal('auth-modal'); showToast(`مرحباً ${n}`); }catch(e){ showToast('الرقم مسجل أو كلمة المرور ضعيفة','e'); } finally{ btn.innerText='إنشاء حساب جديد'; btn.disabled=false; } };
window.loginUser = async () => { const p=document.getElementById('login-phone').value, w=document.getElementById('login-pass').value; if(!p)return showToast('بيانات ناقصة','e'); const btn=document.getElementById('btn-login'); btn.innerText='جاري التحميل...'; btn.disabled=true; try{ await signInWithEmailAndPassword(auth, `0${p}@souq.com`, w); toggleModal('auth-modal'); showToast('تم تسجيل الدخول'); }catch(e){ showToast('البيانات غير صحيحة','e'); } finally{ btn.innerText='تسجيل الدخول'; btn.disabled=false; } };
window.logoutUser = () => { toggleModal('logout-modal'); };
window.confirmLogout = async () => { await signOut(auth); window.location.reload(); };

function updateHeader() {
    const welcomeSection = document.getElementById('header-welcome-section'); const logoutBtn = document.getElementById('btn-logout'); const loginBtn = document.getElementById('btn-header-login');
    if(state.userProfile) { 
        const optimizedProfile = getOptimizedUrl(state.userProfile.photoURL, false, 100).replace('c_fill', 'c_fill,r_max'); 
        welcomeSection.innerHTML = `<div class="profile-btn-header" onclick="handleProfileClick()"><img src="${optimizedProfile}" class="profile-img-header"><div class="profile-name-header"><span>${state.userProfile.displayName}</span><span class="profile-welcome-sub">أهلاً بك</span></div></div>`; 
        logoutBtn.classList.remove('hidden'); loginBtn.classList.add('hidden'); 
    } else { 
        welcomeSection.innerHTML = `<span class="text-[9px] font-bold text-emerald-200 dark:text-slate-400 leading-none">مرحبا بكم في</span><span class="text-[13px] font-black text-white leading-tight">السوق <span class="text-yellow-400">وياك</span></span>`; 
        logoutBtn.classList.add('hidden'); loginBtn.classList.remove('hidden'); 
    }
    if(document.querySelector('.sticky-header')) lucide.createIcons({root: document.querySelector('.sticky-header')});
}

window.openPublisherProfile = async () => {
    if(!state.currentPublisher) return; document.getElementById('pub-img').src = getOptimizedUrl(state.currentPublisher.photoURL, false, 200).replace('c_fill', 'c_fill,r_max'); document.getElementById('pub-name').innerText = state.currentPublisher.displayName; document.getElementById('pub-phone').innerText = state.currentPublisher.phoneNumber;
    const pubBdg = document.getElementById('pub-badge-status'); if(state.currentPublisher.verified) { pubBdg.innerHTML = '<p class="text-blue-800 dark:text-blue-200 font-bold text-xs flex items-center justify-center gap-1"><i data-lucide="check-circle" class="w-4 h-4"></i> حساب موثق</p>'; pubBdg.className = 'bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 mt-2'; pubBdg.classList.remove('hidden'); } else { pubBdg.classList.add('hidden'); }
    toggleModal('publisher-modal'); lucide.createIcons({root: document.getElementById('publisher-modal')});
};

function renderAmenities(list) { document.getElementById('amenities-grid').innerHTML = list.map(a => `<label class="amenity-tile cursor-pointer"><input type="checkbox" class="amenity-check hidden" value="${a}"><div class="text-center py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 truncate">${a}</div></label>`).join(''); }
function initLocations() { const govSelects =['in-gov', 'filter-gov']; govSelects.forEach(id => { const sel = document.getElementById(id); if(sel) { sel.innerHTML = `<option value="" ${id==='in-gov'?'disabled selected':'selected'}>${id==='in-gov'?'المحافظة':'كل المحافظات'}</option>`; Object.keys(EGYPT_LOCATIONS).forEach(gov => { sel.innerHTML += `<option value="${gov}">${gov}</option>`; }); } }); }
window.populateCities = (govId, cityId) => { const gov = document.getElementById(govId).value; const citySel = document.getElementById(cityId); citySel.innerHTML = `<option value="" ${govId==='in-gov'?'disabled selected':'selected'}>${govId==='in-gov'?'المركز/المدينة':'كل المراكز'}</option>`; if(gov && EGYPT_LOCATIONS[gov]) { EGYPT_LOCATIONS[gov].forEach(city => { citySel.innerHTML += `<option value="${city}">${city}</option>`; }); } };
window.toggleFilterPanel = () => { document.getElementById('filter-panel').classList.toggle('open'); };
window.updateFormFields = () => { const cat = document.getElementById('in-category').value; const rF=document.getElementById('room-fields'), fF=document.getElementById('furnished-field'), lI=document.getElementById('in-level'), fA=document.getElementById('in-floors-alt'), lTW=document.getElementById('land-type-wrapper'), lF=document.getElementById('land-fields'), bF=document.getElementById('building-fields'), eF=document.getElementById('extra-fields'); rF.classList.remove('hidden'); fF.classList.remove('hidden'); lI.classList.remove('hidden'); fA.classList.add('hidden'); lTW.classList.add('hidden'); lF.classList.add('hidden'); bF.classList.add('hidden'); eF.classList.remove('hidden'); if(cat==='land') { renderAmenities(LAND_AMENITIES); rF.classList.add('hidden'); fF.classList.add('hidden'); lI.classList.add('hidden'); eF.classList.add('hidden'); lTW.classList.remove('hidden'); lF.classList.remove('hidden'); } else { renderAmenities(ALL_AMENITIES); if (cat === 'building') { rF.classList.add('hidden'); fF.classList.add('hidden'); lI.classList.add('hidden'); fA.classList.remove('hidden'); bF.classList.remove('hidden'); eF.classList.add('hidden'); } else if (['shop','office','warehouse'].includes(cat)) { rF.classList.add('hidden'); eF.classList.add('hidden'); } } };

window.toggleDarkMode = () => { 
    document.documentElement.classList.toggle('dark'); 
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('souq_theme', isDark ? 'dark' : 'light'); 
    document.getElementById('theme-color-meta').setAttribute('content', isDark ? '#1e293b' : '#064e3b');
}; 
if(localStorage.getItem('souq_theme') === 'dark') {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-color-meta').setAttribute('content', '#1e293b');
} else {
    document.getElementById('theme-color-meta').setAttribute('content', '#064e3b');
}

window.showToast=(m,t='s')=>{const d=document.createElement('div');d.className=`toast fixed top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-xl px-4 py-2 rounded-lg border border-${t==='e'?'red':'emerald'}-500 flex items-center gap-2 text-xs font-bold z-[10000] text-slate-800 dark:text-white`;d.innerHTML=`<i data-lucide="${t==='e'?'alert-circle':'check-circle'}" class="w-4 h-4 text-${t==='e'?'red':'emerald'}-500"></i> ${m}`;document.getElementById('toast-container').appendChild(d);lucide.createIcons({root:d});setTimeout(()=>{d.classList.add('hiding');setTimeout(()=>d.remove(),200)},3000)};

function normalizeText(t) { return t ? t.toString().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي') : ""; }

function timeAgo(d) { 
    if(!d) return 'الآن'; 
    try {
        let dateObj;
        if (typeof d.toDate === 'function') {
            dateObj = d.toDate();
        } else if (d.seconds) {
            dateObj = new Date(d.seconds * 1000);
        } else {
            dateObj = new Date(d);
        }

        if (isNaN(dateObj.getTime())) return 'الآن';

        const s = Math.floor((new Date() - dateObj) / 1000); 
        if(s < 60) return 'الآن'; 
        if(s < 3600) return `منذ ${Math.floor(s/60)} د`; 
        if(s < 86400) return `منذ ${Math.floor(s/3600)} س`; 
        return `منذ ${Math.floor(s/86400)} ي`; 
    } catch(e) { 
        return 'الآن'; 
    }
}

function showSkeletons() { const c=document.getElementById('grid-container'); if(state.listings.length === 0) { c.innerHTML=''; for(let i=0;i<8;i++) c.innerHTML+=`<div class="bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 h-full"><div class="h-36 skeleton rounded-t-xl"></div><div class="p-2 space-y-2"><div class="h-3 rounded skeleton w-3/4"></div><div class="h-2 rounded skeleton w-1/2"></div></div></div>`; } }

function loadListings() { if (state.listings.length === 0) { showSkeletons(); } onSnapshot(query(collection(db, COLLECTION_NAME)), (snap) => { state.listings =[]; snap.forEach(d => state.listings.push({id:d.id, ...d.data()})); localStorage.setItem('souq_listings', JSON.stringify(state.listings)); state.listings.sort((a,b) => (a.isPinned === b.isPinned) ? (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0) : (a.isPinned ? -1 : 1)); updateFeaturedSlider(); performSearch(true); document.body.classList.add('app-loaded'); setTimeout(() => { document.getElementById('splash-screen').classList.add('hidden-splash'); }, 100); checkAndOpenUrlProperty(); }); }

window.performSearch = (forceRender = false) => { 
    const q = normalizeText(document.getElementById('search-input').value); 
    const filterGov = document.getElementById('filter-gov').value;
    const filterCity = document.getElementById('filter-city').value;
    const filterType = document.getElementById('filter-type').value;
    const filterCat = document.getElementById('filter-cat').value; 
    const minPrice = Number(document.getElementById('filter-min-price').value) || 0;
    const maxPrice = Number(document.getElementById('filter-max-price').value) || Infinity;

    const isHomeView = !document.getElementById('home-view').classList.contains('hidden');

    let detectedCat = ''; for (const[key, val] of Object.entries(CAT_KEYWORDS)) { if (q.includes(key)) { detectedCat = val; break; } }
    const cont = document.getElementById('grid-container'); 

    if (forceRender || cont.children.length !== state.listings.length) { 
        cont.innerHTML = state.listings.map(item => createCard(item, 'grid')).join(''); 
        lucide.createIcons({ root: cont }); 
    }

    let matchedCount = 0;
    state.listings.forEach(item => { 
        let matchType = true; 
        if (filterType && item.type !== filterType) matchType = false; 
        if (filterCat && item.category !== filterCat) matchType = false; 

        const catNameAr = CAT_MAP[item.category] || ''; const codeSearch = (item.shortCode || (item.id ? item.id.substring(0,3) : '')).toLowerCase();
        const itemText = normalizeText(item.title + item.desc + item.phone + item.gov + item.city + item.location + (item.address || '') + catNameAr + codeSearch);

        const matchText = itemText.includes(q); 
        const matchCat = !detectedCat || item.category === detectedCat; 
        const matchGov = !filterGov || item.gov === filterGov; 
        const matchCity = !filterCity || item.city === filterCity; 
        const matchPrice = item.price >= minPrice && item.price <= maxPrice;

        let isMatch = matchType && matchText && matchCat && matchGov && matchCity && matchPrice; 

        if (isHomeView && item.isPinned) {
            isMatch = false;
        }

        const cardEl = document.getElementById(`card-grid-${item.id}`);
        if (cardEl) { 
            if (isMatch) { 
                if (matchedCount < state.visibleLimit) { cardEl.style.display = ''; } else { cardEl.style.display = 'none'; } 
                matchedCount++; 
            } else { cardEl.style.display = 'none'; } 
        }
    }); 

    const loadMoreBtn = document.getElementById('load-more-container'); const emptyState = document.getElementById('empty-state');
    if(matchedCount === 0) { emptyState.classList.remove('hidden'); loadMoreBtn.classList.add('hidden'); } 
    else { emptyState.classList.add('hidden'); if(matchedCount > state.visibleLimit) { loadMoreBtn.classList.remove('hidden'); } else { loadMoreBtn.classList.add('hidden'); } } 
};

window.loadMore = () => { state.visibleLimit += 8; performSearch(false); };

document.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') {
        const active = document.activeElement;
        if(!active) return;
        if(active.id === 'search-input') { performSearch(false); active.blur(); }
        else if(active.id === 'login-phone') { e.preventDefault(); document.getElementById('login-pass').focus(); }
        else if(active.id === 'login-pass') { e.preventDefault(); loginUser(); }
        else if(active.id === 'reg-name') { e.preventDefault(); document.getElementById('reg-phone').focus(); }
        else if(active.id === 'reg-phone') { e.preventDefault(); document.getElementById('reg-pass').focus(); }
        else if(active.id === 'reg-pass') { e.preventDefault(); registerUser(); }
        else if(active.id === 'chat-msg') { e.preventDefault(); sendMsg(); }
    }
});

let searchTimeout; document.getElementById('search-input').addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => performSearch(false), 200); });

const getOptimizedUrl = (url, isVideo = false, width = 500) => {
    if (!url || !url.includes('cloudinary.com')) return url || `https://via.placeholder.com/${width}?text=No+Image`;
    const parts = url.split('/upload/'); if (parts.length < 2) return url; 
    let params = `w_${width},h_${width},c_fill,q_auto:eco,f_auto`;
    if (isVideo) { let cleanUrl = parts[1]; const lastDot = cleanUrl.lastIndexOf('.'); if (lastDot !== -1) cleanUrl = cleanUrl.substring(0, lastDot) + '.jpg'; return `${parts[0]}/upload/${params},so_0/${cleanUrl}`; } 
    return `${parts[0]}/upload/${params}/${parts[1]}`;
};

function createCard(item, prefix = 'grid') {
    const imgs = Array.isArray(item.images) ? item.images : (item.image ?[item.image] :[]); 
    const firstMedia = imgs[0]; const isVideo = firstMedia && (firstMedia.includes('.mp4') || firstMedia.includes('.mov')); 
    const thumbUrl = getOptimizedUrl(firstMedia, isVideo, 500); 

    let statusOverlay = ''; if(item.status && item.status !== 'available') { const txt = item.status==='sold'?'تم البيع':'تم التأجير'; const clr = item.status==='sold'?'bg-red-600':'bg-blue-600'; statusOverlay=`<div class="absolute inset-0 sold-overlay flex items-center justify-center z-30 pointer-events-none bg-black/50"><span class="${clr} text-white font-black px-6 py-2 rounded-xl shadow-2xl transform -rotate-12 text-sm border border-white/20">${txt}</span></div>`; }

    const pillClass = "flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded py-1 flex justify-center items-center gap-1 shadow-sm";
    let iconsHtml = ''; 
    if(item.category === 'land') { if(item.feddan || item.qirat) iconsHtml += `<span class="${pillClass}"><i data-lucide="maximize" class="w-3 h-3 text-emerald-500"></i> ${item.feddan?item.feddan+' ف':''} ${item.qirat?item.qirat+' ق':''}</span>`; } else if (item.category === 'building') { if(item.floors) iconsHtml += `<span class="${pillClass}"><i data-lucide="layers" class="w-3 h-3 text-blue-500"></i> ${item.floors} أدوار</span>`; } else { if(item.rooms) iconsHtml += `<span class="${pillClass}"><i data-lucide="bed-double" class="w-3 h-3 text-indigo-500"></i> ${item.rooms} غرف</span>`; if(item.baths) iconsHtml += `<span class="${pillClass}"><i data-lucide="bath" class="w-3 h-3 text-cyan-500"></i> ${item.baths} حمام</span>`; }
    if(item.area) iconsHtml += `<span class="${pillClass}"><i data-lucide="ruler" class="w-3 h-3 text-orange-500"></i> ${item.area}م</span>`;

    const locDisplay = item.gov ? `${item.city}، ${item.gov}` : (item.location || ''); const code = item.shortCode || (item.id ? item.id.substring(0,3).toUpperCase() : ''); 
    const shareUrl = window.location.origin + '/property/' + item.id; 
    const waMsg = `مرحبا اريد الاستفسار عن هذا العقار:\n${item.title || ''}\nكود العقار: ${code}\nالرابط: ${shareUrl}`; 
    const waLink = `https://wa.me/20${item.phone}?text=${encodeURIComponent(waMsg)}`;

    return `<div id="card-${prefix}-${item.id}" class="listing-card bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-emerald-800 dark:border-emerald-600 flex flex-col h-full cursor-pointer active:scale-95 transition-transform relative" onclick="openDetails('${item.id}')">
        <div class="relative w-full h-40 shrink-0 bg-slate-200 dark:bg-slate-900">
            ${statusOverlay}
            <span class="absolute top-2 right-2 ${item.type === 'sale' ? 'bg-emerald-600' : 'bg-blue-600'} text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md z-20">${item.type === 'sale' ? 'بيع' : 'إيجار'}</span>
            ${item.isPinned ? `<span class="absolute top-2 left-2 bg-yellow-500 text-slate-900 px-2.5 py-0.5 rounded text-[10px] font-black shadow-md z-20">⭐ مميز</span>` : ''}
            <img src="${thumbUrl}" loading="lazy" decoding="async" class="w-full h-full object-cover ${statusOverlay?'grayscale':''}">
            ${imgs.length > 1 ? `<div class="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><i data-lucide="images" class="w-3 h-3"></i> +${imgs.length-1}</div>` : ''}
            ${isVideo ? `<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 rounded-full p-2"><i data-lucide="play-circle" class="w-8 h-8 text-white/90"></i></div>` : ''}
        </div>
        <div class="p-1.5 flex-1 flex flex-col">
            <div class="flex-1">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-bold text-slate-900 dark:text-white text-[12px] line-clamp-1 leading-tight">${item.title || 'بدون عنوان'}</h3>
                    <span class="font-black text-emerald-600 dark:text-emerald-400 text-[12px] whitespace-nowrap mr-2 bg-emerald-50 dark:bg-slate-900 px-1.5 rounded border dark:border-slate-700">${Number(item.price || 0).toLocaleString()} ج</span>
                </div>
                <div class="flex justify-between items-center text-[9px] text-slate-700 dark:text-slate-300 mb-1.5 px-0.5"><span>كود: <span class="font-bold text-slate-900 dark:text-white">${code}</span></span><span>${timeAgo(item.createdAt)}</span></div>
                ${item.address ? `<div class="flex items-center gap-1 text-[9px] mb-1"><i data-lucide="map" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 shrink-0"></i><span class="truncate leading-tight font-bold text-slate-800 dark:text-slate-200">${item.address}</span></div>` : ''}
                <div class="flex items-center gap-1 text-[9px] text-slate-700 dark:text-slate-300 mb-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 shrink-0"></i><span class="truncate leading-tight">${locDisplay}</span></div>
            </div>
            <div class="mt-auto">
                <div class="flex items-center gap-1.5 text-[10px] text-slate-700 dark:text-slate-200 font-bold mb-1.5 mt-1">${iconsHtml}</div>
                <div class="flex gap-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <a href="${waLink}" target="_blank" onclick="event.stopPropagation()" class="flex-1 bg-[#25D366] text-white py-1.5 rounded flex justify-center items-center gap-1.5 text-[10px] font-bold hover:bg-green-600 transition-all shadow-sm"><i data-lucide="message-circle" class="w-3.5 h-3.5"></i> واتساب</a>
                    <a href="tel:${item.phone}" onclick="event.stopPropagation()" class="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-4 py-1.5 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm border dark:border-slate-700"><i data-lucide="phone" class="w-3.5 h-3.5"></i></a>
                </div>
                <div class="mt-1.5 pt-0.5 border-t border-slate-200 dark:border-slate-700/50">
                    <p class="text-center text-[7px] text-slate-400 dark:text-slate-500 font-bold">اضغط على البطاقة لعرض التفاصيل</p>
                </div>
            </div>
        </div>
    </div>`;
}

window.openDetails = async (id) => {
    if (state.activeDetailsId === id) { toggleModal('details-modal'); return; }
    document.getElementById('d-title').innerText = ''; document.getElementById('d-pub-name').innerText = ''; document.getElementById('d-pub-img').classList.add('hidden');
    const newUrl = new URL(window.location); newUrl.searchParams.set('id', id); window.history.pushState({}, '', newUrl);

    if(toggleModal('details-modal')){
         try {
            const item = state.listings.find(i => i.id === id); if(!item) return;
            state.activeDetailsId = id; state.currentItem = item; state.currentDetailIndex = 0; 

            const renderPublisher = (pubData) => { let nameHtml = pubData.displayName || 'غير معروف'; if(pubData.verified) { nameHtml += ' <i data-lucide="check-circle" class="inline w-3 h-3 text-blue-500 mb-0.5"></i>'; } document.getElementById('d-pub-name').innerHTML = nameHtml; const img = document.getElementById('d-pub-img'); img.src = getOptimizedUrl(pubData.photoURL, false, 100).replace('c_fill', 'c_fill,r_max'); img.classList.remove('hidden'); lucide.createIcons({root: document.getElementById('publisher-bar')}); };

            state.currentPublisher = null;
            if(item.authorId) { if(state.publisherCache[item.authorId]) { state.currentPublisher = state.publisherCache[item.authorId]; renderPublisher(state.currentPublisher); } else { document.getElementById('d-pub-name').innerText = '...'; getDoc(doc(db, "users", item.authorId)).then(pubDoc => { if(pubDoc.exists()) { state.currentPublisher = pubDoc.data(); state.publisherCache[item.authorId] = state.currentPublisher; renderPublisher(state.currentPublisher); } else { state.currentPublisher = DUMMY_PUBLISHER; renderPublisher(DUMMY_PUBLISHER); } }).catch(() => renderPublisher(DUMMY_PUBLISHER)); } } else { state.currentPublisher = DUMMY_PUBLISHER; renderPublisher(DUMMY_PUBLISHER); }

            const code = item.shortCode || (item.id ? item.id.substring(0,3).toUpperCase() : '');
            document.getElementById('d-title').innerText = item.title || ''; document.getElementById('d-price').innerText = Number(item.price || 0).toLocaleString() + ' جنيه'; document.getElementById('d-desc').innerText = item.desc || 'لا يوجد وصف'; document.getElementById('d-time-badge').innerHTML = `${timeAgo(item.createdAt)} &nbsp;|&nbsp; كود: <span class="text-slate-700 dark:text-white font-bold">${code}</span>`;

            const amCont = document.getElementById('d-amenities'); amCont.innerHTML=''; 
            if(item.amenities && Array.isArray(item.amenities) && item.amenities.length > 0) { item.amenities.forEach(a => { amCont.innerHTML += `<div class="p-1.5 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300 border-r border-b border-slate-200 dark:border-slate-700 last:border-r-0">${a}</div>`; }); } else { amCont.innerHTML = `<div class="col-span-3 p-2 text-center text-[9px] text-slate-400">لا توجد مميزات إضافية</div>`; }
            const mapBtn = document.getElementById('d-map'); if(item.mapLink) { mapBtn.classList.remove('hidden'); mapBtn.classList.add('flex'); mapBtn.href = item.mapLink; } else { mapBtn.classList.add('hidden'); mapBtn.classList.remove('flex'); }

            const typeEl = document.getElementById('d-type-badge');
            if(item.status && item.status !== 'available') { typeEl.innerText = item.status === 'sold' ? 'مباع' : 'مؤجر'; typeEl.className = `absolute bottom-2 right-2 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow bg-red-600/90`; } else { typeEl.innerText = item.type === 'sale' ? 'للبيع' : 'للإيجار'; typeEl.className = `absolute bottom-2 right-2 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow bg-emerald-600/90`; }

            const imgs = (Array.isArray(item.images) && item.images.length > 0) ? item.images : (item.image ?[item.image] :['https://via.placeholder.com/600?text=No+Image']); 

            if (imgs[0] && imgs[0].includes('cloudinary.com')) {
                const p = imgs[0].split('/upload/');
                if (p.length === 2) {
                    let cln = p[1];
                    const isVid = cln.includes('.mp4') || cln.includes('.mov') || p[0].includes('/video');
                    if (isVid) {
                        const lastDot = cln.lastIndexOf('.');
                        if (lastDot !== -1) cln = cln.substring(0, lastDot) + '.jpg';
                        new Image().src = `${p[0]}/upload/w_600,h_315,c_fill,q_auto:eco,f_jpg,so_0/${cln}`;
                    } else {
                        new Image().src = `${p[0]}/upload/w_600,h_315,c_fill,q_auto:eco,f_jpg/${cln}`;
                    }
                }
            }

            const updateWaLink = () => { const shareUrl = window.location.origin + '/property/' + item.id; const waMsg = `مرحبا اريد الاستفسار عن هذا العقار:\n${item.title || ''}\nكود العقار: ${code}\nالرابط: ${shareUrl}`; document.getElementById('d-wa').href = `https://wa.me/20${item.phone}?text=${encodeURIComponent(waMsg)}`; }; updateWaLink(); document.getElementById('d-call').href = `tel:${item.phone}`;

            const slider = document.getElementById('details-slider'); 
            slider.innerHTML = imgs.map((src, idx) => { 
                if(!src) return ''; 
                const isVid = src.includes('.mp4') || src.includes('.mov'); 
                let thumb = (idx === 0) ? getOptimizedUrl(src, isVid, 500) : getOptimizedUrl(src, isVid, 800); 
                return isVid ? `<video src="${src}" controls class="w-full h-full object-contain snap-center shrink-0 bg-black"></video>` : `<img src="${thumb}" ${idx > 0 ? 'loading="lazy"' : ''} decoding="async" class="w-full h-full object-cover snap-center shrink-0 cursor-pointer" onclick="openLightbox('${src}', ${idx})">` 
            }).join('');

            setTimeout(() => { 
                if(slider && slider.firstElementChild) { 
                    slider.scrollLeft = 0; 
                    slider.firstElementChild.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'start' }); 
                } 
            }, 10); 

            document.getElementById('details-arrows').style.display = imgs.length > 1 ? 'block' : 'none';

            const locDisplay = item.gov ? `${item.city}، ${item.gov}` : (item.location || '');
            let tableHtml = `<tr><th class="w-1/3 text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="home" class="w-3.5 h-3.5"></i> نوع العقار</th><td class="font-bold text-slate-800 dark:text-slate-200">${CAT_MAP[item.category] || 'عقار'}</td></tr>`;
            if(item.address) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="map" class="w-3.5 h-3.5"></i> العنوان التفصيلي</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.address}</td></tr>`;
            tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i> المحافظة/المركز</th><td class="font-bold text-slate-800 dark:text-slate-200">${locDisplay}</td></tr>`;
            if(item.area) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="ruler" class="w-3.5 h-3.5"></i> المساحة</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.area} م²</td></tr>`;
            if(item.category === 'land') { if(item.landType) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="sprout" class="w-3.5 h-3.5"></i> نوع الأرض</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.landType==='building'?'مباني':'زراعية'}</td></tr>`; if(item.feddan) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="maximize" class="w-3.5 h-3.5"></i> فدان</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.feddan}</td></tr>`; if(item.qirat) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="minimize" class="w-3.5 h-3.5"></i> قيراط</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.qirat}</td></tr>`; } else if (item.category === 'building') { if(item.floors) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="layers" class="w-3.5 h-3.5"></i> عدد الأدوار</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.floors}</td></tr>`; if(item.apartments) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="grid" class="w-3.5 h-3.5"></i> عدد الشقق</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.apartments}</td></tr>`; } else { if(item.rooms) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="bed-double" class="w-3.5 h-3.5"></i> الغرف</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.rooms}</td></tr>`; if(item.baths) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="bath" class="w-3.5 h-3.5"></i> الحمامات</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.baths}</td></tr>`; if(item.balconies) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="wind" class="w-3.5 h-3.5"></i> البلكونات</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.balconies}</td></tr>`; if(item.finishing) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="paint-bucket" class="w-3.5 h-3.5"></i> التشطيب</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.finishing}</td></tr>`; if(item.level) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="arrow-up-circle" class="w-3.5 h-3.5"></i> الدور</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.level}</td></tr>`; if(item.furnished) tableHtml += `<tr><th class="text-slate-500 dark:text-slate-400 font-normal text-[10px] flex items-center gap-1.5"><i data-lucide="sofa" class="w-3.5 h-3.5"></i> الفرش</th><td class="font-bold text-slate-800 dark:text-slate-200">${item.furnished==='yes'?'مفروش':'غير مفروش'}</td></tr>`; }
            document.getElementById('d-table-body').innerHTML = tableHtml;

            const isOwner = state.user && state.user.uid === item.authorId;
            const showControls = state.isAdmin || isOwner;
            const controlsDiv = document.getElementById('d-controls');

            if(showControls) {
                controlsDiv.classList.remove('hidden');
                let controlsHtml = `<div class="grid ${state.isAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} gap-2 w-full bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">`;
                controlsHtml += `<button onclick="del(event,'${item.id}')" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 py-2 rounded-lg text-[10px] font-bold shadow-sm hover:bg-red-100 transition-all flex items-center justify-center gap-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> حذف</button>`;

                if(isOwner || state.isAdmin) { 
                    controlsHtml += `<button onclick="editListing('${item.id}')" class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 py-2 rounded-lg text-[10px] font-bold shadow-sm hover:bg-blue-100 transition-all flex items-center justify-center gap-1"><i data-lucide="edit" class="w-3.5 h-3.5"></i> تعديل</button>`; 
                }

                controlsHtml += `<div class="relative w-full"><select onchange="updateStatus(event, '${item.id}', this.value)" class="appearance-none w-full bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 rounded-lg py-2 pl-6 pr-2 text-[10px] font-bold shadow-sm text-emerald-700 dark:text-emerald-400 outline-none h-full text-center cursor-pointer"><option value="available" ${item.status==='available'?'selected':''}>🟢 متاح</option><option value="sold" ${item.status==='sold'?'selected':''}>🔴 مباع</option><option value="rented" ${item.status==='rented'?'selected':''}>🔵 مؤجر</option></select><i data-lucide="chevron-down" class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 pointer-events-none"></i></div>`;

                if(state.isAdmin) { 
                    controlsHtml += `<button onclick="pin(event,'${item.id}',${item.isPinned})" class="${item.isPinned ? 'bg-yellow-100 dark:bg-slate-900 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600/50' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'} border py-2 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center justify-center gap-1"><i data-lucide="star" class="w-3.5 h-3.5 ${item.isPinned?'fill-current':''}"></i> ${item.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}</button>`; 
                }
                controlsHtml += `</div>`;
                controlsDiv.innerHTML = controlsHtml;
            } else { controlsDiv.classList.add('hidden'); }
            lucide.createIcons({root: document.getElementById('details-modal')});
        } catch(e) { 
            console.error("Error Rendering Details:", e);
        }
    }
}

window.closeDetails = (isHistoryBack = false) => { const slider = document.getElementById('details-slider'); if(slider && slider.firstElementChild) { slider.firstElementChild.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'start' }); } toggleModal('details-modal', isHistoryBack); const newUrl = new URL(window.location); newUrl.searchParams.delete('id'); window.history.pushState({}, '', newUrl); state.activeDetailsId = null; }

window.shareListing = async () => { 
    if(!state.currentItem) return; 
    const shareUrl = window.location.origin + '/property/' + state.currentItem.id;
    const d = { 
        title: 'السوق وياك', 
        text: `شاهد عقار: ${state.currentItem.title}`, 
        url: shareUrl 
    }; 

    try { 
        await navigator.share(d); 
        showToast('تمت المشاركة'); 
    } catch(e) { 
        navigator.clipboard.writeText(d.url); 
        showToast('تم النسخ'); 
    } 
};

window.downloadImages = async () => { 
    if(!state.currentItem || !state.currentItem.images) return; 
    const slider = document.getElementById('details-slider'); 
    let currentIndex = 0; 
    if (slider && slider.children.length > 0) { 
        const scrollLeft = Math.abs(slider.scrollLeft); 
        const itemWidth = slider.clientWidth; 
        currentIndex = Math.round(scrollLeft / itemWidth); 
    } 
    const url = state.currentItem.images[currentIndex]; 
    if (!url) return; 

    showToast('جاري التنزيل في الخلفية...'); 

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        const ext = (url.includes('.mp4') || url.includes('.mov')) ? 'mp4' : 'jpg';
        a.download = `souq_wayak_${state.currentItem.id}_${currentIndex+1}.${ext}`;

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 1000);
    } catch (error) {
        let fallbackUrl = url; 
        if(url.includes('cloudinary.com')) { 
            const parts = url.split('/upload/'); 
            if(parts.length === 2) { 
                fallbackUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`; 
            } 
        } 
        const a = document.createElement('a'); 
        a.style.display = 'none';
        a.href = fallbackUrl; 
        a.download = `souq_wayak_${state.currentItem.id}_${currentIndex+1}`; 
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
    }
};
window.scrollDetails = (dir) => { const slider = document.getElementById('details-slider'); const count = slider.children.length; if(count === 0) return; let newIndex = state.currentDetailIndex + dir; if (newIndex >= count) newIndex = 0; if (newIndex < 0) newIndex = count - 1; state.currentDetailIndex = newIndex; const target = slider.children[newIndex]; target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' }); }
window.openLightbox = (src, idx = 0) => { state.lightboxIndex = idx; updateLightboxImage(); document.getElementById('lightbox').classList.remove('hidden'); history.pushState({modal: 'lightbox'}, '', window.location.href); }
window.closeLightbox = () => { document.getElementById('lightbox').classList.add('hidden'); document.getElementById('lightbox-img').src=''; }
window.changeLightboxImage = (dir) => { if (!state.currentItem || !state.currentItem.images) return; const len = state.currentItem.images.length; state.lightboxIndex = (state.lightboxIndex + dir + len) % len; updateLightboxImage(); };
function updateLightboxImage() { const imgEl = document.getElementById('lightbox-img'); const src = state.currentItem.images[state.lightboxIndex]; if (!src || src.includes('.mp4') || src.includes('.mov')) { showToast("فيديو: يرجى المشاهدة في التفاصيل"); return; } const optimizedSrc = getOptimizedUrl(src, false, 800); if(!imgEl.src) { imgEl.src = optimizedSrc; } else { imgEl.style.opacity = '0.5'; const tempImg = new Image(); tempImg.onload = () => { imgEl.src = optimizedSrc; imgEl.style.opacity = '1'; }; tempImg.src = optimizedSrc; } }

window.toggleModal = function(id, isHistoryBack = false) { 
    const m = document.getElementById(id); 
    const isOpening = m.classList.contains('hidden');
    m.classList.toggle('hidden'); 

    if(document.querySelectorAll('.modal-overlay:not(.hidden)').length > 0) { 
        document.body.style.overflow = 'hidden'; 
        if(isOpening && !isHistoryBack && id !== 'details-modal') history.pushState({modal: id}, '', window.location.href);
    } else { 
        document.body.style.overflow = ''; 
    } 
    return isOpening; 
}

function enableSwipeToClose(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal.firstElementChild;
    let startY = 0, currentY = 0;

    content.addEventListener('touchstart', e => {
        startY = e.touches[0].clientY;
        content.style.transition = 'none';
    }, {passive: true});

    content.addEventListener('touchmove', e => {
        currentY = e.touches[0].clientY;
        let deltaY = currentY - startY;
        if(deltaY > 0) {
            content.style.transform = `translateY(${deltaY}px)`;
        }
    }, {passive: true});

    content.addEventListener('touchend', e => {
        let deltaY = currentY - startY;
        content.style.transition = 'transform 0.3s ease-out';
        if(deltaY > 120) {
            toggleModal(modalId);
            setTimeout(()=> content.style.transform = '', 300);
        } else {
            content.style.transform = 'translateY(0)';
        }
    });
}
setTimeout(() => { enableSwipeToClose('auth-modal'); enableSwipeToClose('publisher-modal'); }, 1000);

function resetAddForm() { 
    state.filesToUpload =[]; state.editingId = null; state.existingImages =[]; 
    document.getElementById('preview-area').innerHTML = ''; 
    document.getElementById('file-upload-input').value = ''; 
    document.getElementById('in-title').value = ''; 
    document.getElementById('in-price').value = ''; 
    document.getElementById('in-area').value = ''; 
    document.getElementById('in-desc').value = ''; 
    document.getElementById('in-map').value = ''; 
    document.getElementById('in-address').value = ''; 
    document.getElementById('in-phone').value = state.userProfile ? state.userProfile.phoneNumber.replace('+20', '') : ''; 
    document.querySelectorAll('.amenity-check').forEach(c => c.checked = false); 
    document.getElementById('furn-no').checked = true;['in-level', 'in-rooms', 'in-baths', 'in-balconies', 'in-finishing', 'in-floors-alt', 'in-apartments', 'in-feddan', 'in-qirat'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    document.getElementById('in-land-type').selectedIndex = 0;
    document.getElementById('in-category').selectedIndex = 0;
    document.getElementById('in-type').selectedIndex = 0;
    document.getElementById('in-gov').selectedIndex = 0;
    document.getElementById('in-city').innerHTML = '<option value="" disabled selected>المركز/المدينة</option>';

    document.getElementById('add-modal-title').innerText = 'إضافة عقار'; 
    const btn = document.getElementById('btn-publish');
    btn.innerText = 'نشر الإعلان';
    btn.disabled = false;
}

window.openAddModal = () => { if(state.user && !state.user.isAnonymous) { resetAddForm(); updateFormFields(); if(toggleModal('add-modal')){ const newUrl = new URL(window.location); newUrl.searchParams.set('mode', 'add'); window.history.pushState({}, '', newUrl); } } else { showToast('يجب تسجيل الدخول أولاً', 'e'); toggleModal('auth-modal'); } };
window.editListing = (id) => { const item = state.listings.find(i => i.id === id); if(!item) return; state.editingId = id; state.existingImages = item.images; closeDetails(); document.getElementById('add-modal-title').innerText = 'تعديل العقار'; document.getElementById('btn-publish').innerText = 'حفظ التعديلات'; document.getElementById('in-category').value = item.category; updateFormFields(); document.getElementById('in-type').value = item.type; document.getElementById('in-title').value = item.title; document.getElementById('in-price').value = item.price; document.getElementById('in-area').value = item.area || ''; document.getElementById('in-gov').value = item.gov; populateCities('in-gov', 'in-city'); setTimeout(() => { document.getElementById('in-city').value = item.city; }, 100); document.getElementById('in-address').value = item.address || ''; document.getElementById('in-phone').value = item.phone || ''; document.getElementById('in-desc').value = item.desc || ''; document.getElementById('in-map').value = item.mapLink || ''; if(item.level) document.getElementById('in-level').value = item.level; if(item.rooms) document.getElementById('in-rooms').value = item.rooms; if(item.baths) document.getElementById('in-baths').value = item.baths; if(item.balconies) document.getElementById('in-balconies').value = item.balconies; if(item.finishing) document.getElementById('in-finishing').value = item.finishing; if(item.floors) document.getElementById('in-floors-alt').value = item.floors; if(item.apartments) document.getElementById('in-apartments').value = item.apartments; if(item.feddan) document.getElementById('in-feddan').value = item.feddan; if(item.qirat) document.getElementById('in-qirat').value = item.qirat; if(item.landType) document.getElementById('in-land-type').value = item.landType; if(item.furnished === 'yes') document.getElementById('furn-yes').checked = true; else document.getElementById('furn-no').checked = true; setTimeout(() => { if(item.amenities && Array.isArray(item.amenities)) { document.querySelectorAll('.amenity-check').forEach(c => { if(item.amenities.includes(c.value)) c.checked = true; }); } }, 100); document.getElementById('preview-area').innerHTML = `<div class="text-[9px] text-slate-500 font-bold p-2 text-center w-full">الصور محفوظة مسبقاً.</div>`; toggleModal('add-modal'); };

async function compressImage(file, targetWidth = 1024) { if (file.type.startsWith('video')) return file; return new Promise((resolve) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = (e) => { const img = new Image(); img.src = e.target.result; img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); let width = img.width; let height = img.height; if (width > targetWidth) { height *= targetWidth / width; width = targetWidth; } canvas.width = width; canvas.height = height; ctx.drawImage(img, 0, 0, width, height); canvas.toBlob((blob) => { resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })); }, 'image/jpeg', 0.7); }; }; }); }
window.handleUpload = async (input) => { if(input.files.length + state.filesToUpload.length > 10) return showToast('10 ملفات كحد أقصى','e'); showToast('جاري معالجة الصور...'); for(let f of input.files){ const compressedFile = await compressImage(f); state.filesToUpload.push(compressedFile); await new Promise(resolve => setTimeout(resolve, 10)); } renderPreview(); }; function renderPreview() { const area = document.getElementById('preview-area'); area.innerHTML = state.filesToUpload.map((f, idx) => { const isVid = f.type.startsWith('video'); const url = URL.createObjectURL(f); return `<div class="relative w-12 h-12 shrink-0 group">${isVid ? `<video src="${url}" class="w-full h-full rounded-lg object-cover border border-slate-200"></video>` : `<img src="${url}" class="w-full h-full rounded-lg object-cover border border-slate-200">`}<button onclick="removeFile(${idx})" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm"><i data-lucide="x" class="w-3 h-3"></i></button></div>`}).join(''); lucide.createIcons({root: area}); }
window.removeFile = (idx) => { state.filesToUpload.splice(idx, 1); renderPreview(); }
async function uploadToCloudinary(file) { const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', 'souq_upload'); const res = await fetch('https://api.cloudinary.com/v1_1/db9h7zm1h/auto/upload', { method: 'POST', body: formData }); const data = await res.json(); return data.secure_url; }

window.submitListing = async () => { 
    try { 
        const gov = document.getElementById('in-gov').value; 
        const city = document.getElementById('in-city').value; 
        if(!gov || !city) return showToast('يرجى اختيار المحافظة والمركز', 'e'); 

        let uploadedUrls =[]; 
        if(state.filesToUpload.length > 0) { 
            const btn = document.getElementById('btn-publish'); 
            btn.innerText='جاري الرفع...'; 
            btn.disabled = true; 
            for(let f of state.filesToUpload) { 
                const url = await uploadToCloudinary(f); 
                uploadedUrls.push(url); 
            } 
        } else if (state.editingId) { 
            uploadedUrls = state.existingImages; 
        } else { 
            return showToast('مطلوب صورة أو فيديو','e'); 
        } 

        document.getElementById('btn-publish').innerText = 'جاري المعالجة...'; 
        document.getElementById('btn-publish').disabled = true; 

        const am =[]; document.querySelectorAll('.amenity-check:checked').forEach(c => am.push(c.value)); 
        const cat = document.getElementById('in-category').value; 
        const furnished = document.querySelector('input[name="furnished"]:checked')?.value; 
        const landType = document.getElementById('in-land-type').value; 

        const listingData = { title: document.getElementById('in-title').value, price: Number(document.getElementById('in-price').value), type: document.getElementById('in-type').value, category: cat, area: Number(document.getElementById('in-area').value) || 0, feddan: Number(document.getElementById('in-feddan').value) || 0, qirat: Number(document.getElementById('in-qirat').value) || 0, landType: landType, floors: Number(cat === 'building' ? document.getElementById('in-floors-alt').value : document.getElementById('in-floors-alt').value) || 0, apartments: Number(document.getElementById('in-apartments').value) || 0, rooms: Number(document.getElementById('in-rooms').value) || 0, baths: Number(document.getElementById('in-baths').value) || 0, balconies: Number(document.getElementById('in-balconies').value) || 0, finishing: document.getElementById('in-finishing').value, level: document.getElementById('in-level').value, furnished: furnished, gov: gov, city: city, address: document.getElementById('in-address').value, phone: document.getElementById('in-phone').value, desc: document.getElementById('in-desc').value, mapLink: document.getElementById('in-map').value, amenities: am, images: uploadedUrls, image: uploadedUrls[0] }; 

        if(state.editingId) { 
            await updateDoc(doc(db, COLLECTION_NAME, state.editingId), listingData); 
            showToast('تم حفظ التعديلات بنجاح'); 
        } else { 
            const generatedCode = Math.floor(100 + Math.random() * 900).toString(); 
            listingData.shortCode = generatedCode; 
            listingData.status = 'available'; 
            listingData.isPinned = false; 
            listingData.createdAt = serverTimestamp(); 
            listingData.authorId = state.user.uid; 
            await addDoc(collection(db, COLLECTION_NAME), listingData); 
            showToast('تم النشر بنجاح'); 
        } 
        toggleModal('add-modal'); 
        resetAddForm(); 
    } catch(e) { 
        console.error(e); 
        showToast('حدث خطأ أثناء العملية', 'e'); 
        document.getElementById('btn-publish').innerText = state.editingId ? 'حفظ التعديلات' : 'نشر الإعلان'; 
        document.getElementById('btn-publish').disabled = false; 
    } 
};

let itemToDelete = null;
window.del = (e, id) => {
    if(e) e.stopPropagation();
    itemToDelete = id;
    toggleModal('delete-modal');
};
window.confirmDelete = async () => {
    if(!itemToDelete) return;
    const btn = document.getElementById('btn-confirm-delete');
    btn.disabled = true; btn.innerText = 'جاري الحذف...';
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, itemToDelete));
        showToast('تم الحذف بنجاح');
        closeDetails();
        toggleModal('delete-modal');
    } catch(e) {
        showToast('خطأ في الحذف', 'e');
    } finally {
        btn.disabled = false; btn.innerText = 'نعم، حذف';
        itemToDelete = null;
    }
};

window.pin=async(e,id,s)=>{if(e)e.stopPropagation();await updateDoc(doc(db, COLLECTION_NAME, id),{isPinned:!s});showToast(s?'تم إلغاء التثبيت':'تم التثبيت'); closeDetails();};
window.updateStatus = async (e, id, newStatus) => { if(e) e.stopPropagation(); const item = state.listings.find(i => i.id === id); if(item) { item.status = newStatus; const typeEl = document.getElementById('d-type-badge'); if(typeEl) { if(newStatus !== 'available') { typeEl.innerText = newStatus === 'sold' ? 'مباع' : 'مؤجر'; typeEl.className = `absolute bottom-2 right-2 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow bg-red-600/90`; } else { typeEl.innerText = item.type === 'sale' ? 'للبيع' : 'للإيجار'; typeEl.className = `absolute bottom-2 right-2 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow bg-emerald-600/90`; } } } try { await updateDoc(doc(db, COLLECTION_NAME, id), { status: newStatus }); showToast('تم تحديث الحالة'); } catch(err) { console.error(err); showToast('خطأ في التحديث', 'e'); } };

window.toggleChat=()=>{if(toggleModal('chat-modal')){if(!state.chatId&&state.chatStep===0&&!state.welcomeSent){state.welcomeSent=true;setTimeout(()=>botMsg('مرحباً! 👋<br>ما هو الاسم؟'),100)}}};
window.sendMsg=async()=>{const t=document.getElementById('chat-msg').value.trim();if(!t)return;document.getElementById('chat-msg').value='';userMsg(t);if(!state.chatId){if(state.chatStep===0){state.tempName=t;state.chatStep=1;setTimeout(()=>botMsg(`أهلاً ${t}، كيف نساعدك؟`),200)}else if(state.chatStep===1){state.chatStep=2;setTimeout(()=>botMsg('جاري تحويلك للدعم الفني...'),200);const r=await addDoc(collection(db,"chats"),{userId:state.user.uid,userName:state.tempName,lastMsg:t,status:'waiting',messages:[{s:'bot',t:`الاسم: ${state.tempName}`,d:new Date()},{s:'user',t,d:new Date()},{s:'bot',t:'جاري تحويلك للدعم الفني...',d:new Date()}],createdAt:serverTimestamp()});state.chatId=r.id;listenChat(r.id)}}else{const s=await getDocs(query(collection(db,"chats"),where('__name__','==',state.chatId)));if(!s.empty){const m=s.docs[0].data().messages;m.push({s:'user',t,d:new Date()});await updateDoc(doc(db,"chats",state.chatId),{messages:m,lastMsg:t,status:'waiting'})}}};
function listenChat(id){onSnapshot(doc(db,"chats",id),s=>{if(s.exists()){const d=s.data();if(d.status==='closed'){state.chatId=null;state.chatStep=0;state.welcomeSent=false;document.getElementById('chat-box').innerHTML='';showToast("تم إنهاء المحادثة");toggleModal('chat-modal');return}document.getElementById('chat-box').innerHTML='';d.messages.forEach(m=>{if(!m.t.startsWith('الاسم'))(m.s==='user'?userMsg:botMsg)(m.t)})}})};
function checkUserChat(){onSnapshot(query(collection(db,"chats"),where('userId','==',state.user.uid),where('status','!=','closed')),s=>{if(!s.empty){state.chatId=s.docs[0].id;state.chatStep=2;listenChat(state.chatId)}})};
function userMsg(t){const d=document.createElement('div');d.className="flex justify-start";d.innerHTML=`<div class="bg-emerald-100 text-emerald-900 px-3 py-2 rounded-xl rounded-tr-none shadow-sm text-xs max-w-[85%]">${t}</div>`;document.getElementById('chat-box').appendChild(d);document.getElementById('chat-box').scrollTop=9999}
function botMsg(t){const d=document.createElement('div');d.className="flex justify-end";d.innerHTML=`<div class="bg-white dark:bg-slate-800 dark:text-white text-slate-800 px-3 py-2 rounded-xl rounded-tl-none shadow-sm text-xs max-w-[85%] border dark:border-slate-700">${t}</div>`;document.getElementById('chat-box').appendChild(d);document.getElementById('chat-box').scrollTop=9999}

window.toggleAdminPanel=()=>{document.getElementById('admin-panel').classList.toggle('hidden');if(!document.getElementById('admin-panel').classList.contains('hidden'))refreshAdmin()};

window.searchAdminUser = async () => {
    let phoneInput = document.getElementById('admin-target-phone').value.trim();
    if(!phoneInput) return showToast('أدخل رقم الهاتف للبحث', 'e');
    let phone = phoneInput.replace(/\D/g, '');
    if(phone.startsWith('0')) phone = phone.substring(1);
    let fullPhone = `+20${phone}`;

    const resDiv = document.getElementById('admin-search-result');
    resDiv.innerHTML = 'جاري البحث... <i data-lucide="loader-2" class="w-3 h-3 inline animate-spin"></i>';
    resDiv.classList.remove('hidden');
    lucide.createIcons({root: resDiv});

    try {
        const q = query(collection(db, "users"), where("phoneNumber", "==", fullPhone));
        const snap = await getDocs(q);
        if(snap.empty) {
            resDiv.innerHTML = '<span class="text-red-400 font-bold flex items-center gap-1"><i data-lucide="x-circle" class="w-3 h-3"></i> لا يوجد مستخدم بهذا الرقم</span>';
        } else {
            const u = snap.docs[0].data();
            let roles =[];
            if(u.isAdmin) roles.push('أدمن 🛡️');
            if(u.verified) roles.push('موثق ✅');
            if(u.isBlocked) roles.push('محظور 🚫');
            if(roles.length === 0) roles.push('مستخدم عادي 👤');

            resDiv.innerHTML = `
                <div class="flex items-center gap-2 mb-1">
                    <img src="${u.photoURL || 'https://cdn-icons-png.flaticon.com/512/609/609803.png'}" class="w-6 h-6 rounded-full border border-white/20 object-cover">
                    <span class="font-bold text-emerald-400 text-xs">${u.displayName}</span>
                </div>
                <div class="font-bold text-white/90">الحالة: <span class="text-white font-normal">${roles.join(' | ')}</span></div>
            `;
        }
        lucide.createIcons({root: resDiv});
    } catch(e) {
        resDiv.innerHTML = '<span class="text-red-400">حدث خطأ أثناء البحث</span>';
    }
};

window.applyAdminAction = async (isGranting) => { 
    let phoneInput = document.getElementById('admin-target-phone').value.trim(); 
    if(!phoneInput) return showToast('أدخل رقم الهاتف أولاً', 'e'); 
    let phone = phoneInput.replace(/\D/g, ''); 
    if(phone.startsWith('0')) phone = phone.substring(1); 
    let fullPhone = `+20${phone}`; 
    const action = document.querySelector('input[name="admin_role"]:checked').value; 
    try { 
        const q = query(collection(db, "users"), where("phoneNumber", "==", fullPhone)); 
        const snap = await getDocs(q); 
        if(snap.empty) { return showToast('لم يتم العثور على حساب', 'e'); } 
        const userDocId = snap.docs[0].id; 
        await updateDoc(doc(db, "users", userDocId), {[action]: isGranting }); 
        showToast(`تم ${isGranting ? 'التفعيل' : 'الإلغاء'} بنجاح`); 
        document.getElementById('admin-target-phone').value = ''; 
        document.getElementById('admin-search-result').classList.add('hidden');
    } catch(e) { console.error(e); showToast('حدث خطأ في النظام', 'e'); } 
};

window.refreshAdmin=()=>{onSnapshot(query(collection(db,"chats"),where('status','!=','closed')),s=>{const l=document.getElementById('admin-users-list');l.innerHTML='';s.forEach(d=>{const dt=d.data();l.innerHTML+=`<div onclick="loadAdmin('${d.id}','${dt.userName}')" class="p-3 mb-2 bg-white/5 rounded-xl cursor-pointer border border-white/10"><div class="font-bold text-xs text-white flex justify-between"><span>${dt.userName}</span>${dt.status==='waiting'?'<span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>':''}</div><div class="text-[10px] text-gray-400 truncate mt-1">${dt.lastMsg}</div></div>`})})};
window.loadAdmin=(id,n)=>{state.activeAdminChat=id;document.getElementById('admin-chat-header').innerHTML=`<span class="text-xs font-bold">${n}</span><button onclick="kickUser()" id="btn-end-chat" class="hidden bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><i data-lucide="slash" class="w-3 h-3"></i> إنهاء</button>`;document.getElementById('btn-end-chat').classList.remove('hidden');onSnapshot(doc(db,"chats",id),s=>{const b=document.getElementById('admin-msg-area');b.innerHTML='';if(!s.exists())return;s.data().messages.forEach(m=>{b.innerHTML+=`<div class="${m.s==='support'?'text-left':'text-right'} mb-2"><span class="inline-block px-3 py-2 rounded-lg text-xs ${m.s==='support'?'bg-slate-900 dark:bg-emerald-600 text-white':'bg-white/10'}">${m.t}</span></div>`});b.scrollTop=9999})};
window.sendAdminMsg=async()=>{const t=document.getElementById('admin-input').value;if(!t||!state.activeAdminChat)return;document.getElementById('admin-input').value='';const s=await getDocs(query(collection(db,"chats"),where('__name__','==',state.activeAdminChat)));const m=s.docs[0].data().messages;m.push({s:'support',t,d:new Date()});await updateDoc(doc(db,"chats",state.activeAdminChat),{messages:m,status:'active'})};
window.kickUser=async()=>{if(confirm("إنهاء المحادثة؟")){await updateDoc(doc(db,"chats",state.activeAdminChat),{status:'closed'});document.getElementById('admin-msg-area').innerHTML='';document.getElementById('btn-end-chat').classList.add('hidden');state.activeAdminChat=null}};

if ('serviceWorker' in navigator) {
    const swCode = `const CACHE_NAME = 'souq-cache-v1'; const ASSETS =['./', 'https://cdn.tailwindcss.com', 'https://unpkg.com/lucide@latest', 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap']; self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)))); self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });`;
    const blob = new Blob([swCode], {type: 'application/javascript'}); const swUrl = URL.createObjectURL(blob); navigator.serviceWorker.register(swUrl).catch(e => console.log(e));
}
lucide.createIcons();
