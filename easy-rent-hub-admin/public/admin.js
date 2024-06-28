document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const bufferingIndicator = document.getElementById('bufferingIndicator');
  const uploadButton = document.getElementById('uploadButton');
  const requiredInputs = Array.from(uploadForm.querySelectorAll('input[required], select[required]'));

  let imagesBuffered = false;
  let bufferedImages = [];

  const checkFormValidity = () => {
    const allFilled = requiredInputs.every(input => input.value.trim() !== '');
    if (allFilled && imagesBuffered) {
      uploadButton.disabled = false;
    } else {
      uploadButton.disabled = true;
    }
  };

  requiredInputs.forEach(input => {
    input.addEventListener('input', checkFormValidity);
    input.addEventListener('change', checkFormValidity);
  });

  const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height *= maxWidth / width;
              width = maxWidth;
            } else {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.7);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const sanitizeString = (str) => {
    return str.replace(/[^\p{L}\p{N}\s.-]/gu, '');
  };

  const validateFormData = (formData) => {
    for (let pair of formData.entries()) {
      if (!pair[1]) {
        return false;
      }
    }
    return true;
  };

  const updateBufferedImages = () => {
    imagesBuffered = bufferedImages.length > 0;
    checkFormValidity();
  };

  const updateImagePreviews = () => {
    imagePreviewContainer.innerHTML = '';
    bufferedImages.forEach((image, index) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(image.blob);
      
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-icon';
      removeButton.innerHTML = '<img src="remove-icon.png" alt="Remove">';
      removeButton.onclick = () => {
        bufferedImages = bufferedImages.filter((_, i) => i !== index);
        updateBufferedImages();
        updateImagePreviews();
      };

      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'image-preview';
      imageWrapper.dataset.index = index;
      imageWrapper.appendChild(img);
      imageWrapper.appendChild(removeButton);
      imagePreviewContainer.appendChild(imageWrapper);
    });
    bufferingIndicator.style.display = 'none';
  };

  new Sortable(imagePreviewContainer, {
    animation: 150,
    onEnd: () => {
      const newBufferedImages = [];
      const previews = imagePreviewContainer.querySelectorAll('.image-preview');
      previews.forEach(preview => {
        const index = preview.dataset.index;
        newBufferedImages.push(bufferedImages[index]);
      });
      bufferedImages = newBufferedImages;
    }
  });

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', sanitizeString(document.getElementById('title').value));
    formData.append('availableDate', sanitizeString(document.getElementById('availableDate').value));
    formData.append('rooms', sanitizeString(document.getElementById('rooms').value));
    formData.append('bathrooms', sanitizeString(document.getElementById('bathrooms').value));
    formData.append('location', sanitizeString(document.getElementById('location').value));
    formData.append('name', sanitizeString(document.getElementById('name').value));
    formData.append('price', sanitizeString(document.getElementById('price').value));
    formData.append('description', sanitizeString(document.getElementById('description').value));
  
    const tagsInput = document.getElementById('tags').value;
    const tagsArray = tagsInput.split(';').map(tag => sanitizeString(tag.trim()));
    formData.append('tags', JSON.stringify(tagsArray));
    formData.append('rented', false);

    bufferedImages.forEach((image, index) => {
      formData.append('images', image.blob, image.name);
    });

    if (!validateFormData(formData)) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Property uploaded successfully!');
        uploadForm.reset();
        bufferedImages = [];
        imagePreviewContainer.innerHTML = '';
        updateBufferedImages();
        loadProperties();
      } else {
        const errorText = await response.text();
        alert(`Failed to upload property: ${errorText}`);
      }
    } catch (error) {
      alert('An error occurred while uploading the property.');
    }
  });

  document.getElementById('images').addEventListener('change', async () => {
    const files = document.getElementById('images').files;
    bufferingIndicator.style.display = 'block';
    const imagePromises = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      imagePromises.push(resizeImage(file, 600, 600).then(resizedImageBlob => {
        bufferedImages.push({ blob: resizedImageBlob, name: file.name });
      }));
    }

    await Promise.all(imagePromises);
    updateImagePreviews();
    updateBufferedImages();
  });

  async function loadProperties() {
    try {
      const response = await fetch('/api/properties');
      const properties = await response.json();
      if (!Array.isArray(properties)) {
        throw new Error('Expected properties to be an array');
      }
      const propertyList = document.getElementById('propertyList');
      propertyList.innerHTML = '';
      properties.forEach(property => {
        const li = document.createElement('li');
        li.textContent = `${property.name} - ${property.availableDate}`;
        li.id = `property-${property._id}`;
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'buttons';
  
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => {
          const deleteResponse = await fetch(`/api/properties/${property._id}`, { method: 'DELETE' });
          if (deleteResponse.ok) {
            alert('Property deleted successfully!');
            loadProperties();
          } else {
            alert('Failed to delete property.');
          }
        });
        buttonsDiv.appendChild(deleteButton);
  
        const statusButton = document.createElement('button');
        statusButton.textContent = property.rented ? 'Available' : 'Rented';
        statusButton.className = property.rented ? 'available' : 'rented';
        statusButton.addEventListener('click', async () => {
          const newStatus = !property.rented;
          statusButton.textContent = newStatus ? 'Available' : 'Rented';
          statusButton.className = newStatus ? 'available' : 'rented';
          try {
            const response = await fetch(`/api/properties/${property._id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ rented: newStatus })
            });
  
            if (response.ok) {
              console.log(`Property marked as ${newStatus ? 'available' : 'rented'} successfully!`);
              setTimeout(() => {
                loadProperties();
              }, 500);
            } else {
              const errorText = await response.text();
              alert(`Failed to mark property as ${newStatus ? 'available' : 'rented'}.`);
            }
          } catch (error) {
            alert('An error occurred while updating the property status.');
          }
        });
        buttonsDiv.appendChild(statusButton);
  
        li.appendChild(buttonsDiv);
        propertyList.appendChild(li);
      });
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  }
  
  window.onload = loadProperties;
});
