document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const bufferingIndicator = document.getElementById('bufferingIndicator');
  const uploadButton = document.getElementById('uploadButton');
  const requiredInputs = Array.from(uploadForm.querySelectorAll('input[required], select[required]'));

  let imagesBuffered = false;

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
    return str.replace(/[^\p{L}\p{N}\s.-]/gu, ''); // Allow word characters, numbers, spaces, dots, and hyphens
  };

  const validateFormData = (formData) => {
    for (let pair of formData.entries()) {
      if (!pair[1]) {
        return false;
      }
    }
    return true;
  };

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');

    const convertSqftToSqm = (sqft) => {
      const sqm = sqft * 0.092903;
      return sqm.toFixed(2); // return with two decimals
    }

    const areaInput = document.getElementById('area');
    const sqmValue = parseFloat(convertSqftToSqm(parseFloat(areaInput.value)));
    const formData = new FormData();
    formData.append('title', sanitizeString(document.getElementById('title').value));
    formData.append('availableDate', sanitizeString(document.getElementById('availableDate').value));
    formData.append('rooms', sanitizeString(document.getElementById('rooms').value));
    formData.append('bathrooms', sanitizeString(document.getElementById('bathrooms').value));
    formData.append('area', sqmValue); // Ensure area is a number
    formData.append('location', sanitizeString(document.getElementById('location').value));
    formData.append('name', sanitizeString(document.getElementById('name').value));
    formData.append('price', sanitizeString(document.getElementById('price').value));
    formData.append('description', sanitizeString(document.getElementById('description').value));
  
    const tagsInput = document.getElementById('tags').value;
    const tagsArray = tagsInput.split(';').map(tag => sanitizeString(tag.trim()));
    formData.append('tags', JSON.stringify(tagsArray));

    // Set rented to false
    formData.append('rented', false);

    const images = document.getElementById('images').files;
    const resizedImages = await Promise.all(Array.from(images).map(async (image) => {
      try {
        const resizedImageBlob = await resizeImage(image, 600, 600); // Resize to max 600x600
        return { blob: resizedImageBlob, name: image.name };
      } catch (error) {
        console.error('Error resizing image:', error);
        alert('An error occurred while processing images.');
        return null;
      }
    }));

    resizedImages.filter(Boolean).forEach(image => {
      formData.append('images', image.blob, image.name);
    });

    // Log the FormData entries manually
    console.log('FormData before fetch:');
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
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

      console.log('Fetch response:', response);

      if (response.ok) {
        alert('Property uploaded successfully!');
        uploadForm.reset(); // Reset the form after successful submission
        loadProperties();
      } else {
        const errorText = await response.text();
        console.log('Error Text:', errorText);
        console.log(response);
        alert(`Failed to upload property: ${errorText}`);
      }
    } catch (error) {
      console.error('Error during upload:', error);
      alert('An error occurred while uploading the property.');
    }
  });

  // Handle image preview and buffering
  document.getElementById('images').addEventListener('change', () => {
    imagePreviewContainer.innerHTML = '';
    bufferingIndicator.style.display = 'block';
    uploadButton.disabled = true;

    const files = document.getElementById('images').files;
    const bufferedImages = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100px';
        img.style.margin = '5px';
        imagePreviewContainer.appendChild(img);
        bufferedImages.push(e.target.result);

        if (bufferedImages.length === files.length) {
          bufferingIndicator.style.display = 'none';
          imagesBuffered = true;
          checkFormValidity();
        }
      };
      reader.readAsDataURL(file);
    });
  });

  async function loadProperties() {
    const response = await fetch('/api/properties');
    const properties = await response.json();
    const propertyList = document.getElementById('propertyList');
    propertyList.innerHTML = '';
    properties.forEach(property => {
      const li = document.createElement('li');
      li.textContent = `${property.name} - ${property.availableDate}`;
      li.id = `property-${property.id}`;
      
      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'buttons';
  
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', async () => {
        const deleteResponse = await fetch(`/api/properties/${property.id}`, { method: 'DELETE' });
        if (deleteResponse.ok) {
          alert('Property deleted successfully!');
          loadProperties();
        } else {
          alert('Failed to delete property.');
        }
      });
      buttonsDiv.appendChild(deleteButton);
  
      // Add Rented/Available button
      const statusButton = document.createElement('button');
      statusButton.textContent = property.rented ? 'Available' : 'Rented'; // fix button text
      statusButton.className = property.rented ? 'available' : 'rented'; // fix class name here
      statusButton.addEventListener('click', async () => {
        const newStatus = !property.rented;
        statusButton.textContent = newStatus ? 'Available' : 'Rented'; // Immediately change button text
        statusButton.className = newStatus ? 'available' : 'rented'; // Immediately change button class
        try {
          // Get the full property details
          const response = await fetch(`/api/properties/${property.id}`);
          const propertyDetails = await response.json();
          propertyDetails.rented = newStatus;

          const statusResponse = await fetch(`/api/properties/${property.id}`, { 
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(propertyDetails)
          });

          if (statusResponse.ok) {
            console.log(`Property marked as ${newStatus ? 'available' : 'rented'} successfully!`);
            // Refresh properties after short delay to avoid UI lag
            setTimeout(() => {
              loadProperties();
            }, 500);
          } else {
            const errorText = await statusResponse.text();
            console.error('Failed to update property status:', errorText);
            alert(`Failed to mark property as ${newStatus ? 'available' : 'rented'}.`);
          }
        } catch (error) {
          console.error('Error during status update:', error);
          alert('An error occurred while updating the property status.');
        }
      });
      buttonsDiv.appendChild(statusButton);
  
      li.appendChild(buttonsDiv);
      propertyList.appendChild(li);
    });
  }

  async function refreshProperty(propertyId) {
    try {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (response.ok) {
        const property = await response.json();
        const propertyElement = document.getElementById(`property-${propertyId}`);
        if (propertyElement) {
          propertyElement.querySelector('.buttons button:nth-child(2)').textContent = property.rented ? 'Available' : 'Rented';
          propertyElement.querySelector('.buttons button:nth-child(2)').className = property.rented ? 'available' : 'rented';
        }
      } else {
        console.error('Failed to fetch property data:', await response.text());
      }
    } catch (error) {
      console.error('Error during refresh property:', error);
    }
  }
  
  window.onload = loadProperties;
});
