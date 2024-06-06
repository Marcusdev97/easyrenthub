document.addEventListener('DOMContentLoaded', () => {
    const propertyList = document.getElementById('property-list');
    const navLinks = document.querySelectorAll('.nav-links a');
    const modal = document.getElementById("myModal");
    const modalDetails = document.getElementById("modal-details");
    const carouselImages = document.getElementById("carousel-images");
    const appointmentButton = document.getElementById("appointment-button");
    const span = document.getElementsByClassName("close")[0];
    let currentImageIndex = 0;

    function fetchProperties(location) {
        fetch(`/api/properties?location=${location}`)
            .then(response => response.json())
            .then(properties => displayProperties(properties))
            .catch(error => {
                console.error('Error fetching properties:', error);
                propertyList.innerHTML = '<p>无法获取房产列表。</p>';
            });
    }

    function displayProperties(properties) {
        propertyList.innerHTML = '';

        if (properties.length === 0) {
            propertyList.innerHTML = '<p>没有屋子出租中。</p>';
            return;
        }

        properties.forEach(property => {
            const propertyCard = document.createElement('div');
            propertyCard.className = 'property-card';

            propertyCard.innerHTML = `
                <img src="${property.images[0]}" alt="Property Image">
                <div class="property-details">
                    <h2>${property.name}</h2>
                    <p>建筑面积: ${property.area}</p>
                    <p class="price">${property.price}</p>
                    <div class="meta-info">
                        ${property.tags.map(tag => `<span>${tag}</span>`).join('')}
                    </div>
                    <p>${property.description}</p>`;
            propertyCard.addEventListener('click', () => {
                modalDetails.innerHTML = `
                    <h2>${property.name}</h2>
                    <p>建筑面积: ${property.area}</p>
                    <p class="price">${property.price}</p>
                    <div class="meta-info">
                        ${property.tags.map(tag => `<span>${tag}</span>`).join('')}
                    </div>
                    <p>${property.description}</p>
                    <p>${property.details}</p>
                `;
                currentImageIndex = 0;
                carouselImages.innerHTML = property.images.map(image => `<img src="${image}" alt="Property Image">`).join('');
                updateCarousel();

                modal.style.display = "block";
            });

            propertyList.appendChild(propertyCard);
        });
    }

    function updateCarousel() {
        const images = carouselImages.querySelectorAll('img');
        images.forEach((img, index) => {
            img.style.display = (index === currentImageIndex) ? 'block' : 'none';
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
            fetchProperties(location);
        });
    });

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // 点击Header显示所有房产信息
    document.getElementById('all-properties').addEventListener('click', function() {
        fetchProperties('all');
    });

    // 默认显示所有房产信息
    fetchProperties('all');

    // 复制链接并弹出提示框
    appointmentButton.addEventListener('click', () => {
        const url = window.location.href;
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('你已经复制该网页，请找负责人预约看房。');
    });
});
