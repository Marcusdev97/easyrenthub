let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;

let currentImageIndex = 0; // Initialize currentImageIndex

document.addEventListener('DOMContentLoaded', () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const body = document.body;

    if (isMobile) {
        body.classList.add('mobile');
    }

    const propertyList = document.getElementById('property-list');
    const navLinks = document.querySelectorAll('.nav-links a');
    const modal = document.getElementById("myModal");
    const modalDetails = document.getElementById("modal-details");
    const carouselImages = document.getElementById("carousel-images");
    const span = document.getElementsByClassName("close")[0];
    const fullImageModal = document.getElementById('full-image-modal');
    const fullImage = document.getElementById('full-image');
    const fullImageClose = document.getElementById('full-image-close');
    const qrModal = document.getElementById('qr-modal');
    const qrClose = document.getElementById('qr-close');
    const wechatButton = document.getElementById('wechat-button');
    const whatsappButton = document.getElementById('whatsapp-button');
    const locationDescription = document.getElementById('location-description');
    const descriptionText = document.getElementById('description-text');
    const locationTips = document.getElementById('location-tips');

    // Descriptions and tips for locations
    const descriptions = {
        SS13: `<strong>SS13</strong> 小区全称为The Grand Subang SS13，与SS15同属一个开发商，小区建面风格类似，是SS15隔壁街区。非泰莱大学校车途径，距离莫纳什大学较近，可步行至莫纳什大学。小区配套游泳池健身房，楼下有本地餐馆以及便利店，生活便利程度完全可以保障。`,
        SS15: `<strong>SS15</strong> 小区全称为The Grand Subang Jaya SS15，是泰莱大学校车途径小区，距离学校直线距离约为5.1km，驾车约为12分钟可达。小区24h安保，配套游泳池健身房篮球场等。因其地处小吃街，楼下各国美食应有尽有。附近学校有：英迪大学，亚洲大学，双威大学等。附近医院有：梳邦医疗中心。`,
        CasaTiara: `<strong>CasaTiara</strong> 是属于SS16区域的小区，有校车途径。整体SS16小区房价较低，许多泰莱大学同学选择居住在这里，性价比高，步行10分钟即可到达商场以及超市。。`,
        IconCity: `<strong>IconCity</strong> 小区距离泰莱大学约4km，非校车途径。户型选择多，整体房价较低。小区配套设施较好，游泳池健身房以及游戏室等，小区环境优雅，安保系数高。`,
        Greenfield: `<strong>Greenfield</strong> 是泰莱大学校车途径小区，距离学校直线距离约为3.6km，驾车约为10分钟可达。小区24h安保，配套游泳池健身房学习室等。附近生活便利，距离双威金字塔商场仅2km，楼下有各类中餐馆以及杂货店等。附近学校有：双威国际学校、莫纳什大学、双威大学等。附近医院有：双威医疗中心。`,
        GeoLake: `<strong>Geo 和 Geolake</strong> 是同为Sunway开发商旗下的高端小区，其地理位置紧邻彼此，出小区门后就是Sunway Avenue商场，也可经此通过人行天桥直达泰莱大学。小区配套设施豪华，无边游泳池健身房学习室以及小区内绿化公园等，安保系数也是最高等级。`,
        GeoSense: `<strong>Geo 和 Geolake</strong> 是同为Sunway开发商旗下的高端小区，其地理位置紧邻彼此，出小区门后就是Sunway Avenue商场，也可经此通过人行天桥直达泰莱大学。小区配套设施豪华，无边游泳池健身房学习室以及小区内绿化公园等，安保系数也是最高等级。`,
        Union: `<strong>Union Suites</strong> 小区距离泰莱大学仅2km，可通过人行天桥步行直达泰莱大学。小区配套设施非常好，有游泳池健身房拳击台学习室等，居住群体多为留学生。楼下即有Sunway Avenue商场，生活便利。`,
        Edumetro: `<strong>Edumetro</strong> 小区距离泰莱大学大概7km，该小区户型整体偏小，大多为一居室和两居室，适合独居或情侣租住。步行10分钟即有本地餐馆以及杂货店，性价比较高。`
    };

    const tips = {
        SS13: `距离莫纳什大学较近，生活便利。`,
        SS15: `地处小吃街，楼下各国美食应有尽有。`,
        CasaTiara: `性价比高，户型选择多。`,
        IconCity: `性价比高，户型选择多。`,
        Greenfield: `生活便利，距离双威金字塔商场仅2km。`,
        GeoLake: `紧邻Sunway Avenue商场，设施豪华。`,
        GeoSense: `紧邻Sunway Avenue商场，设施豪华。`,
        Union: `步行可达泰莱大学，小区配套设施高端。`,
        Edumetro: `户型面积小，性价比高。`
    };
    
    if (qrClose) {
        qrClose.onclick = function() {
            qrModal.style.display = "none";
        }
    }

    window.onclick = function(event) {
        if (event.target == qrModal) {
            qrModal.style.display = "none";
        }
        if (event.target == fullImageModal) {
            fullImageModal.style.display = "none";
        }
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    wechatButton.onclick = function() {
        const url = 'images/wechatNamecard.jpg'; // Directly set the image path
        document.getElementById('qrcode').innerHTML = `<img src="${url}" alt="二维码">`;
        qrModal.style.display = "block";
    };

    whatsappButton.onclick = function() {
        window.location.href = "https://wa.me/601133698121";
    };

    async function getProperties() {
        try {
            const response = await fetch('/api/properties');
            const properties = await response.json();
    
            if (!properties || properties.length === 0) {
                propertyList.innerHTML = '<p>未找到该位置的房源。</p>';
            } else {
                displayProperties('all', properties);
            }
        } catch (error) {
            console.error('获取房源时出错:', error);
            propertyList.innerHTML = '<p>加载房源失败，请稍后重试。</p>';
        }
    }
    
    function displayProperties(location, properties) {
        propertyList.innerHTML = '';
        const filteredProperties = location === 'all' ? properties : properties.filter(property => property.location === location);
    
        if (filteredProperties.length === 0) {
            propertyList.innerHTML = '<p>未找到该位置的房源。</p>';
            return;
        }
    
        filteredProperties.sort((a, b) => a.rented - b.rented);
    
        filteredProperties.forEach(property => {
            const propertyCard = document.createElement('div');
            propertyCard.className = 'property-card';
            if (property.rented) {
                propertyCard.classList.add('rented');
            }
    
            const propertyImage = property.images && property.images[0] ? `/api/images/${property.images[0]}` : 'default-image.jpg';
            const propertyTitle = property.name ? property.name : '无可用标题';
            const propertyPrice = property.price ? `RM${property.price}` : '未提供价格';
            const propertyTags = property.tags ? property.tags.map(tag => `<span>${tag}</span>`).join('') : '';
            const propertyDescription = property.description ? property.description : '无描述';
            const propertyRooms = property.rooms ? `${property.rooms}` : '无卧室信息';
            const propertyBathrooms = property.bathrooms ? `${property.bathrooms}` : '无浴室信息';
            const availableDate = property.availableDate ? `${formatDate(property.availableDate)}` : '无可入住日期信息';
    
            propertyCard.innerHTML = `
                <div class="image-container">
                    <img src="${propertyImage}" alt="房源图片">
                    ${property.rented ? '<div class="overlay-text">不好意思，此单位已经出租！</div>' : ''}
                    </div>
                    <div class="property-details">
                    <h2>${propertyTitle}</h2>
                    <p class="price">价格: ${propertyPrice}</p>
                    <p>卧室: ${propertyRooms}</p>
                    <p>浴室: ${propertyBathrooms}</p>
                    <p>描述: ${propertyDescription}</p>
                    <p class="available-date">可入住时间: ${availableDate}</p>
                    <div class="meta-info">
                        ${propertyTags}
                    </div>
                </div>
            `;
    
            if (!property.rented) {
                propertyCard.addEventListener('click', () => {
                    const modalImage = property.images ? property.images.map(image => `<img src="/api/images/${image}" alt="房源图片" class="modal-property-image">`).join('') : '';
                    const modalDetailsContent = `
                        <div class="modal-details">
                            <h2>${propertyTitle}</h2>
                            <p class="price"><strong>价格:</strong> ${propertyPrice}</p>
                            <p><strong>卧室:</strong> ${propertyRooms}</p>
                            <p><strong>浴室:</strong> ${propertyBathrooms}</p>
                            <p class="available-date"><strong>可入住时间:</strong> ${availableDate}</p>
                            <p><strong>描述:</strong> ${propertyDescription}</p>
                            <div class="meta-info">
                                ${propertyTags}
                            </div>
                        </div>
                    `;
    
                    modalDetails.innerHTML = modalDetailsContent;
                    currentImageIndex = 0;
                    carouselImages.innerHTML = modalImage;
                    updateCarousel();
    
                    document.querySelectorAll('.modal-property-image').forEach(img => {
                        img.addEventListener('click', () => {
                            fullImage.src = img.src;
                            fullImageModal.style.display = "block";
                        });
                    });
    
                    modal.style.display = "block";
                });
            }
    
            propertyList.appendChild(propertyCard);
        });
    }
    
    
    getProperties();    
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

    function displayProperties(location, properties) {
        propertyList.innerHTML = '';
        const filteredProperties = location === 'all' ? properties : properties.filter(property => property.location === location);
    
        if (filteredProperties.length === 0) {
            propertyList.innerHTML = '<p>未找到该位置的房源。</p>';
            return;
        }
    
        filteredProperties.sort((a, b) => a.rented - b.rented);
    
        filteredProperties.forEach(property => {
            const propertyCard = document.createElement('div');
            propertyCard.className = 'property-card';
            if (property.rented) {
                propertyCard.classList.add('rented');
            }
    
            const propertyImage = property.images && property.images[0] ? property.images[0] : 'default-image.jpg';
            const propertyTitle = property.name ? property.name : '无可用标题';
            const propertyPrice = property.price ? `RM${property.price}` : '未提供价格';
            const propertyTags = property.tags ? property.tags.map(tag => `<span>${tag}</span>`).join('') : '';
            const propertyDescription = property.description ? property.description : '无描述';
            const propertyRooms = property.rooms ? `${property.rooms}` : '无卧室信息';
            const propertyBathrooms = property.bathrooms ? `${property.bathrooms}` : '无浴室信息';
            const availableDate = property.availableDate ? `${formatDate(property.availableDate)}` : '无可入住日期信息';
    
            propertyCard.innerHTML = `
                <div class="image-container">
                    <img src="${propertyImage}" alt="房源图片">
                    ${property.rented ? '<div class="overlay-text">不好意思，此单位已经出租！</div>' : ''}
                    </div>
                    <div class="property-details">
                    <h2>${propertyTitle}</h2>
                    <p class="price">价格: ${propertyPrice}</p>
                    <p>卧室: ${propertyRooms}</p>
                    <p>浴室: ${propertyBathrooms}</p>
                    <p>描述: ${propertyDescription}</p>
                    <p class="available-date">可入住时间: ${availableDate}</p>
                    <div class="meta-info">
                        ${propertyTags}
                    </div>
                </div>
            `;
    
            if (!property.rented) {
                propertyCard.addEventListener('click', () => {
                    const modalImage = property.images ? property.images.map(image => `<img src="${image}" alt="房源图片" class="modal-property-image">`).join('') : '';
                    const modalDetailsContent = `
                        <div class="modal-details">
                            <h2>${propertyTitle}</h2>
                            <p class="price"><strong>价格:</strong> ${propertyPrice}</p>
                            <p><strong>卧室:</strong> ${propertyRooms}</p>
                            <p><strong>浴室:</strong> ${propertyBathrooms}</p>
                            <p class="available-date"><strong>可入住时间:</strong> ${availableDate}</p>
                            <p><strong>描述:</strong> ${propertyDescription}</p>
                            <div class="meta-info">
                                ${propertyTags}
                            </div>
                        </div>
                    `;
    
                    modalDetails.innerHTML = modalDetailsContent;
                    currentImageIndex = 0;
                    carouselImages.innerHTML = modalImage;
                    updateCarousel();
    
                    document.querySelectorAll('.modal-property-image').forEach(img => {
                        img.addEventListener('click', () => {
                            fullImage.src = img.src;
                            fullImageModal.style.display = "block";
                        });
                    });
    
                    modal.style.display = "block";
                });
            }
    
            propertyList.appendChild(propertyCard);
        });
    }    

    function updateCarousel() {
        const images = carouselImages.querySelectorAll('img');
        images.forEach((img, index) => {
            img.style.display = (index === currentImageIndex) ? 'block' : 'none';
            img.style.width = 'auto';
            img.style.height = '100%'; // Adjusted to fit container height
            img.style.objectFit = 'cover'; // Ensure it covers the container properly
        });
    }

    carouselImages.addEventListener('touchstart', handleTouchStart, false);
    carouselImages.addEventListener('touchend', handleTouchEnd, false);

    function handleTouchStart(event) {
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
    }

    function handleTouchEnd(event) {
        const touch = event.changedTouches[0];
        endX = touch.clientX;
        endY = touch.clientY;
        handleSwipe();
    }

    function handleSwipe() {
        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Detect horizontal swipe
            if (diffX > 0) {
                // Swipe right
                currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : carouselImages.querySelectorAll('img').length - 1;
            } else {
                // Swipe left
                currentImageIndex = (currentImageIndex < carouselImages.querySelectorAll('img').length - 1) ? currentImageIndex + 1 : 0;
            }
            updateCarousel();
        }
    }

    function updateCarousel() {
        const images = carouselImages.querySelectorAll('img');
        images.forEach((img, index) => {
            img.style.display = (index === currentImageIndex) ? 'block' : 'none';
            img.style.width = '100%';
            img.style.height = isMobile ? '300px' : '300px';
            img.style.objectFit = 'cover'; 
        });
    }

    document.getElementById('prev').addEventListener('click', () => {
        currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : carouselImages.querySelectorAll('img').length - 1;
        updateCarousel();
    });

    document.getElementById('next').addEventListener('click', () => {
        currentImageIndex = (currentImageIndex < carouselImages.querySelectorAll('img').length - 1) ? currentImageIndex + 1 : 0;
        updateCarousel();
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const location = this.getAttribute('data-location');
            getPropertiesByLocation(location);
        });
    });

    async function getPropertiesByLocation(location) {
        try {
            const response = await fetch(`/api/properties?location=${location}`);
            const properties = await response.json();

            if (properties) {
                displayProperties(location, properties);
                descriptionText.innerHTML = descriptions[location];
                locationTips.innerHTML = tips[location];
                locationDescription.style.display = 'block';
            } else {
                propertyList.innerHTML = '<p>加载房源失败，请稍后重试。</p>';
            }
        } catch (error) {
            console.error('获取房源时出错:', error);
            propertyList.innerHTML = '<p>加载房源失败，请稍后重试。</p>';
        }
    }

    if (span) {
        span.onclick = function() {
            modal.style.display = "none";
        }
    }

    if (fullImageClose) {
        fullImageClose.onclick = function() {
            fullImageModal.style.display = "none";
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
        if (event.target == fullImageModal) {
            fullImageModal.style.display = "none";
        }
    }

    document.getElementById('all-properties').addEventListener('click', function() {
        getProperties();
        locationDescription.style.display = 'none';
    });
});
