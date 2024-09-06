

const firebaseConfig = {
    apiKey: "AIzaSyDRGzwePftO0o42hMGCQHx-K845Xjl4zEQ",
    authDomain: "quicksell-374b8.firebaseapp.com",
    projectId: "quicksell-374b8",
    storageBucket: "quicksell-374b8.appspot.com",
    messagingSenderId: "984641749083",
    appId: "1:984641749083:web:6fa3360232f0fc8fceff7e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();


document.addEventListener('DOMContentLoaded', function () {



    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const caption = document.getElementById('caption');
    const close = document.querySelector('.close');

    //document.getElementById('userPofile').style.display='none';
    document.getElementById('sign-in').style.display = 'none';
    document.getElementById('user').style.display = 'none';
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const role = userDoc.data().role;
            console.log(role);
            console.log(user.uid);
            
         
            // Show admin panel based on role
            document.getElementById('admin-panel').style.display = (role === 'Admin' || role === 'Vendor') ? 'block' : 'none';
            document.getElementById('user').style.display = 'block';
            // Call the function to update delete button visibility
            updateDeleteButtonsVisibility(role, user.uid);

        } else {
            document.getElementById('sign-in').style.display = 'block';

            // Hide all delete buttons if not logged in
            document.querySelectorAll('.delete').forEach(button => {
                button.style.display = 'none';
            });
        }
    });
    function updateDeleteButtonsVisibility(role, userId) {
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.getAttribute('data-product-id');
            const deleteButton = card.querySelector('.delete');
            if (role === 'Admin' || (role === 'Vendor' && card.getAttribute('data-vendor-id') === userId)) {
                deleteButton.style.display = 'inline-block';
            } else {
                deleteButton.style.display = 'none';
            }
        });
    }


    document.getElementById('user').addEventListener('click', () => {
        window.location.href = 'html/profile.html';
    });

    // Example function to get the user's profile picture URL after login
    function updateProfilePictureFromFirestore() {
        const user = firebase.auth().currentUser;

        if (user) {
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(user.uid);

            userRef.get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    const profilePicUrl = userData.profileImageUrl; // Assuming you store the URL under `profileImageUrl`

                    if (profilePicUrl) {
                        // Update the profile picture in the index page
                        const profilePictureElement = document.getElementById('userProfile');
                        if (profilePictureElement) {
                            profilePictureElement.src = profilePicUrl;
                            console.log("Profile picture updated from Firestore:", profilePicUrl);
                        } else {
                            console.error("Element with id 'userProfile' not found.");
                        }
                    } else {
                        console.log("No profile picture URL found in Firestore.");
                    }
                } else {
                    console.log("No user document found in Firestore.");
                }
            }).catch((error) => {
                console.error("Error getting document from Firestore:", error);
            });
        } else {
            console.error("No authenticated user found.");
        }
    }

    // Call this function after login
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            updateProfilePictureFromFirestore();
            // Additional code to handle successful login
        } else {
            console.error("No user signed in.");
        }
    });


    document.getElementById('product-image').addEventListener('change', function () {

        const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
        document.getElementById('file-name').textContent = fileName;
    });


    const buttons = document.querySelectorAll('#hero button');
    buttons.forEach(button => {
        button.addEventListener('click', function () {
            alert(`Button clicked: ${this.textContent}`);
        });
    });

    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    hamburger.addEventListener('click', () => {
        nav.classList.toggle('open');
    });

    // Intersection Observer for Hero Section
    const hero = document.querySelector('#hero');
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                hero.classList.add('animate');
            }
        });
    }, { threshold: 0.1 });
    heroObserver.observe(hero);

    // Intersection Observer for How It Works Section
    const steps = document.querySelectorAll('.step');
    const stepsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.1 });
    steps.forEach(step => {
        stepsObserver.observe(step);
    });

    // Intersection Observer for Products Section

    async function uploadImage(file, oldImageUrl) {
        if (!file) return oldImageUrl;

        const storageRef = storage.ref();
        const uniqueFileName = `${Date.now()}_${file.name}`; // Use timestamp or UUID for uniqueness
        const newImageRef = storageRef.child(`ProductImage/${uniqueFileName}`);

        // If there is an old image URL, delete the old image
        if (oldImageUrl) {
            const oldImagePath = decodeURIComponent(oldImageUrl.split('/o/')[1].split('?')[0]);
            const oldImageRef = storageRef.child(oldImagePath);

            try {
                await oldImageRef.delete();
            } catch (error) {
                console.log("Old image deletion error:", error);
            }
        }

        // Upload the new image
        await newImageRef.put(file);
        return newImageRef.getDownloadURL();
    }

    async function saveProductToFirestore(productId, name, price, expiryDays, imageFile) {
        try {
            const productRef = db.collection('products').doc(productId);
            const user = auth.currentUser; // Get the current user

            // Fetch the user's document
            const userDoc = await db.collection('users').doc(user.uid).get();

            // Upload image or use existing URL
            const imageUrl = await uploadImage(imageFile);

            // Prepare the updated product data
            const updatedProductData = {
                name,
                price,
                expiryDays,
                vendorId: user.uid,
                email: userDoc.data().email,
                user_id: user.uid,
                imageFileUrl: imageUrl || '../images/product.png',
                timestamp: Date.now() // Store the current timestamp
            };

            // Save the product data to Firestore with merging
            await productRef.set(updatedProductData, { merge: true });

            console.log('Product saved successfully');
        } catch (error) {
            console.error('Error saving product:', error);
        }
    }

    // Render product card and then update the button visibility
    function renderProductCard(product) {
        const { id, name, price, expiryDays, imageFileUrl, timestamp, vendorId } = product;
        const newProductCard = document.createElement('div');
        newProductCard.classList.add('product-card');
        newProductCard.setAttribute('data-product-id', id);
        newProductCard.setAttribute('data-vendor-id', vendorId); // Assuming vendorId is stored in the product data

        newProductCard.innerHTML = `
        <img src="${imageFileUrl}" alt="${name}">
        <h3>${name}</h3>
        <p>Price: ₹${price.toFixed(2)}</p>
        <p class="expiry-timer">Expires in ${expiryDays} days</p>
        <button class="buy" id="buy">buy</button>
        <button class="add" id="add">Add</button>  
        <button class="delete" id="delete" data-product-id="${id}" data-image-url="${imageFileUrl}">Delete</button>
    `;
        document.getElementById('product-grid').appendChild(newProductCard);
        newProductCard.querySelector('img').addEventListener('click', () => {
            modal.style.display = "block";
            modalImg.src = imageFileUrl;
            caption.textContent = name;
        });
        newProductCard.querySelector('.delete').addEventListener('click', function () {
            const productId = this.getAttribute('data-product-id');
            const imageUrl = this.getAttribute('data-image-url');
            const confirmDelete = confirm("Are you sure you want to delete this product?");

            if (confirmDelete) {
                deleteProductFromFirestore(productId, imageUrl);
            }
        });
        const expiryTimer = newProductCard.querySelector('.expiry-timer');

        let timerInterval;

        function updateTimer() {
            const now = Date.now();
            const expiryDate = new Date(timestamp + expiryDays * 24 * 60 * 60 * 1000);
            const timeLeft = expiryDate - now;

            // Calculate days, hours, minutes, and seconds
            const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
            const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);

            // Format the timer text
            const timerText = `${daysLeft}d : ${hoursLeft}h : ${minutesLeft}m : ${secondsLeft}s`;
            expiryTimer.textContent = timerText;

            // If expired, remove the product
            if (timeLeft <= 0) {
                clearInterval(timerInterval); // Stop the interval
                expiryTimer.textContent = 'Expired'; // Update text to 'Expired'

                setTimeout(() => {
                    // Remove the product card from the DOM after the grace period
                    deleteProductFromFirestore(id, imageFileUrl);
                    newProductCard.remove();
                }, 10000);
            }
        }

        // Update the timer immediately and then every second
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
        auth.onAuthStateChanged(user => {
            if (user) {
                db.collection('users').doc(user.uid).get().then(userDoc => {
                    const role = userDoc.data().role;
                    updateDeleteButtonsVisibility(role, user.uid);

                });
            }
        });
    }


    function logAction(userId, actionType, resourceId, email) {
        db.collection('auditLogs').add({
            userId,
            actionType,
            resourceId,
            email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    async function deleteProductFromFirestore(productId, imageFileUrl) {
        const productRef = db.collection('products').doc(productId);

        try {
            // Delete product document
            const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
            logAction(auth.currentUser.uid, 'delete', productId, userDoc.data().email);
            await productRef.delete();
            console.log(`Product ${productId} deleted successfully`);

            if (imageFileUrl) {
                // Decode and clean the URL to extract the correct path
                const imagePath = decodeURIComponent(imageFileUrl.split('/o/')[1].split('?')[0]);
                console.log("Attempting to delete image at path:", imagePath);

                const imageRef = storage.ref().child(imagePath);

                try {
                    // Check if the file exists
                    await imageRef.getDownloadURL();
                    console.log(`Image at ${imagePath} exists, proceeding to delete`);

                    // Delete the image
                    await imageRef.delete();
                    console.log(`Image at ${imagePath} deleted successfully`);
                } catch (error) {
                    if (error.code === 'storage/object-not-found') {
                        console.log(`Image at ${imagePath} does not exist`);
                    } else {
                        console.error('Error checking image existence:', error);
                    }
                }
            } else {
                console.log(`No image URL provided for product ${productId}`);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }


    const productGrid = document.getElementById('product-grid');
    const loader = document.getElementById('loader');
    db.collection('products').onSnapshot(snapshot => {
        loader.style.display = 'block';
        productGrid.style.display = 'none';
        productGrid.innerHTML = ''; // Clear existing products

        const product = [];
        snapshot.forEach(doc => {
            const prod = { id: doc.id, ...doc.data() };
            product.push(prod);
        });

        // Render up to 6 products
        const displayedProducts = product.slice(0, 6);
        displayedProducts.forEach(product => renderProductCard(product));

        // Function to add or remove the "View More" button
        function updateViewMoreButton() {
            const existingViewMoreButton = document.querySelector('.view-more');

            if (product.length > 6) {
                if (!existingViewMoreButton) {
                    const viewMoreButton = document.createElement('button');
                    viewMoreButton.textContent = 'View More';
                    viewMoreButton.classList.add('view-more');
                    viewMoreButton.addEventListener('click', () => {
                        window.location.href = 'html/product.html'; // Navigate to product.html
                    });
                    // Append to main section instead of product grid
                    productGrid.parentNode.appendChild(viewMoreButton);
                }
            } else if (existingViewMoreButton) {
                existingViewMoreButton.remove(); // Remove button if no longer needed
            }
        }
        // Initial call to update the "View More" button
        updateViewMoreButton();
        loader.style.display = 'none';
        productGrid.style.display = 'flex';
        const products = document.querySelector('#products');
        const productsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    products.classList.add('animate');
                    // Animate product cards individually
                    const productCards = document.querySelectorAll('.product-card');
                    productCards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('animate');
                        }, index * 50); // Stagger animation by 100ms
                    });
                }
            });
        }, { threshold: 0.1 });
        productsObserver.observe(products);

    });
    function generateRandomId(length = 12) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            id += charset[randomIndex];
        }
        return id;
    }

    // Function to check if the ID already exists in Firestore
    async function isIdUnique(id) {
        const productRef = db.collection('products').doc(id);
        const doc = await productRef.get();
        return !doc.exists; // Return true if the ID does not exist
    }

    // Function to generate a unique ID and save a new product
    async function getUniqueProductId() {
        let unique = false;
        let id = '';

        while (!unique) {
            id = generateRandomId();
            unique = await isIdUnique(id);
        }

        return id;
    }


    const productForm = document.getElementById('product-form');
    productForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        document.getElementById('spinner').style.display = 'block';
        //  const productId = document.getElementById('product-id').value.trim();
        const productId = await getUniqueProductId();
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const expiryDays = parseInt(document.getElementById('expiry-days').value, 10);
        const imageFile = document.getElementById('product-image').files[0];
        console.log('Form submitted with:', { productId, name, price, expiryDays, imageFile });

        if (!productId || isNaN(price) || isNaN(expiryDays)) {
            document.getElementById('spinner').style.display = 'none';
            alert('Please fill out all fields correctly and upload an image.');
            console.error('Invalid input values');
            return;
        }

        try {
            await saveProductToFirestore(productId, name, price, expiryDays, imageFile);
            document.getElementById('spinner').style.display = 'none';
            alert('Product updated/added successfully');
            productForm.reset();
            document.getElementById('file-name').textContent = 'No file chosen';

        } catch (error) {
            document.getElementById('spinner').style.display = 'none';
            console.error('Error updating product:', error);
        }
    });


    close.addEventListener('click', () => {
        modal.style.display = "none";
    });

    // Close modal when user clicks outside of the image
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
    // Form submit handler
    document.getElementById('vendor-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        document.getElementById('vendor-spinner').style.display = 'block';

        const name = document.getElementById('vendor-name').value.trim();
        const address = document.getElementById('shop-address').value.trim();
        const mobile = document.getElementById('mobile-number').value.trim();
        const imageFile = document.getElementById('vendor-image').files[0];
        const fileNameDisplay = document.getElementById('vendor-file-name');
        if (!name || !address || !mobile || !imageFile) {
            alert('Please fill out all fields and upload an image.');
            return;
        }

        try {
            const userEmail = auth.currentUser.email;
            let imageUrl = '';

            if (imageFile) {
                imageUrl = await uploadVendorImage(imageFile, userEmail);
            } else {
                alert('No image uploaded');
            }

            const vendorData = {
                name,
                address,
                mobile,
                imageUrl: imageUrl || '',
                email: userEmail,
                userId: auth.currentUser.uid,
                timestamp: Date.now()
            };

            await db.collection('vendors').doc(userEmail).set(vendorData);
            await refreshVendorListAndForm();
            document.getElementById('vendor-form-container').style.display = 'none';
            alert('Successfully added vendor');
        } catch (error) {
            console.error('Error saving vendor information:', error);
        } finally {
            document.getElementById('vendor-spinner').style.display = 'none';
        }
    });

    // Authentication state listener
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userRole = await getUserRole(user.uid);
            const vendorRef = db.collection('vendors').doc(user.email);
            const vendorDoc = await vendorRef.get();
            const h2 = document.getElementById('h2-vendorList');
            console.log(77)
            if (vendorDoc.exists) {
                // Vendor exists, hide form and display vendor list
                h2.style.display = 'block';
                document.getElementById('vendor-form-container').style.display = 'none';
                document.getElementById('vendors').style.display = 'block';
            } else {
                // User is an Admin or another role; show vendor list only
                document.getElementById('vendor-form-container').style.display = 'none';
                document.getElementById('vendors').style.display = 'block';
                h2.style.display = 'block';
            }

            // Always display all vendors
            await refreshVendorListAndForm();
        } else {
            // Redirect to login if not signed in
            window.location.href = 'html/loginSignUp.html';
        }
    });
});

document.getElementById('vendor-edit-cancel').style.display = 'none';
// Handle vendor edit functionality
async function handleEditVendor(vendorData) {

    db.collection('vendors').doc(vendorData.email).get().then((vendorDoc) => {
        document.getElementById('edit-AddvendorH1').textContent = "Edit Vendor";
        const cancel = document.getElementById('vendor-edit-cancel');
        cancel.addEventListener('click', () => {
            document.getElementById('edit-AddvendorH1').textContent = "Add Vendor";
            cancel.style.display = 'none'
            // Hide the vendor form container
            const formContainer = document.getElementById('vendor-form-container');
            if (formContainer) {
                formContainer.style.display = 'none';

            }

            // Show the vendor list or edit button
            const vendorListContainer = document.getElementById('vendor-list-container');
            if (vendorListContainer) {
                vendorListContainer.style.display = 'block'; // Ensure the vendor list is visible
            }
        })
        document.getElementById('vendor-edit-cancel').style.display = 'block';
        const vendorData = vendorDoc.data();
        document.getElementById('vendor-form-container').scrollIntoView({ behavior: 'auto' });

        document.getElementById('vendor-name').value = vendorData.name;
        document.getElementById('shop-address').value = vendorData.address;
        document.getElementById('mobile-number').value = vendorData.mobile;
        document.getElementById('vendor-image').value = ''; // Clear file input
        document.getElementById('vendor-form-container').style.display = 'block';
        document.getElementById('vendors').style.display = 'block';

        const fileNameDisplay = document.getElementById('vendor-file-name');
        fileNameDisplay.textContent = 'No file chosen';

        document.getElementById('vendor-form').onsubmit = async function (e) {
            e.preventDefault();
            document.getElementById('vendor-spinner').style.display = 'block';

            const name = document.getElementById('vendor-name').value.trim();
            const address = document.getElementById('shop-address').value.trim();
            const mobile = document.getElementById('mobile-number').value.trim();
            const imageFile = document.getElementById('vendor-image').files[0];

            if (!name || !address || !mobile) {
                alert('Please fill out all fields.');
                return;
            }

            try {
                let imageUrl = vendorData.imageUrl; // Keep existing image if not updated

                if (imageFile) {
                    imageUrl = await uploadVendorImage(imageFile, auth.currentUser.email);
                }

                const updatedVendorData = {
                    name,
                    address,
                    mobile,
                    imageUrl,
                    timestamp: Date.now()
                };

                await db.collection('vendors').doc(vendorData.email).update(updatedVendorData);
                displayAllVendors(await getUserRole(auth.currentUser.uid), vendorData.email);
                document.getElementById('vendor-form-container').style.display = 'none';
                alert('Successfully updated vendor');
            } catch (error) {
                console.error('Error updating vendor information:', error);
            } finally {
                document.getElementById('vendor-spinner').style.display = 'none';
            }
        };
    }).catch(error => {
        console.error('Error fetching vendor data:', error);
    });
}

// Handle vendor delete functionality
async function handleDeleteVendor(vendorData) {
    try {
        await deleteVendorFromFirestore(vendorData.email);

        const vendorCard = document.querySelector(`.vendor-card[data-user-id="${vendorData.email}"]`);
        vendorCard.style.transition = 'opacity 0.6s ease';
        vendorCard.style.opacity = '0';
        setTimeout(() => {
            vendorCard.remove();
            // After removal, refresh the vendor list and show the form if needed
            refreshVendorListAndForm();

        }, 600);
    } catch (error) {
        console.error('Error deleting vendor:', error);
    }
}


// Function to delete vendor from Firestore and Storage
async function deleteVendorFromFirestore(email) {
    const vendorRef = db.collection('vendors').doc(email);
    const vendorDoc = await vendorRef.get();

    if (vendorDoc.exists) {
        const vendorData = vendorDoc.data();
        const imageUrl = vendorData.imageUrl;

        if (imageUrl) {
            const storageRef = firebase.storage().ref();
            const imagePath = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
            const vendorImageRef = storageRef.child(imagePath);

            try {
                await vendorImageRef.delete();
                console.log(`Image at ${imagePath} deleted successfully`);
            } catch (error) {
                if (error.code === 'storage/object-not-found') {
                    console.log(`Image at ${imagePath} does not exist.`);
                } else {
                    console.error('Error deleting image:', error);
                }
            }
        }

        await vendorRef.delete();
        console.log(`Vendor with email ${email} deleted successfully`);
    } else {
        console.error('Vendor document not found.');
    }
}

// Function to refresh vendor list and show the form if needed
// Function to refresh vendor list and show the form if needed
async function refreshVendorListAndForm() {
    const user = auth.currentUser;

    if (user) {
        const userRole = await getUserRole(user.uid);

        // Fetch all vendors from Firestore
        const vendorsSnapshot = await db.collection('vendors').get();
        const userDoc = await db.collection('vendors').doc(user.email).get(); // Get the document and check its existence

        const h2 = document.getElementById('h2-vendorList');

        if (userRole === 'Vendor') {
            if (userDoc.exists) {
                // Vendor data exists, show the vendor list and hide the form
                document.getElementById('vendor-form-container').style.display = 'none';
                document.getElementById('vendors').style.display = 'block';
                h2.style.display = 'block';
            } else {
                // Vendor data does not exist, show the form to add vendor
                document.getElementById('vendor-form-container').style.display = 'block';
                document.getElementById('vendors').style.display = 'block';
                h2.style.display = 'block';
            }
        } else if (userRole === 'Admin' || userRole === 'User') {
            // Admins should always see the vendor list and not the form
            document.getElementById('vendor-form-container').style.display = 'none';
            document.getElementById('vendors').style.display = 'block';
            h2.style.display = 'block';
        } else {
            // For other roles (e.g., User), show the vendor list
            document.getElementById('vendor-form-container').style.display = 'none';
            document.getElementById('vendors').style.display = 'none';
            h2.style.display = 'none';
        }

        // Display all vendors
        await displayAllVendors(userRole, user.email);
    } else {
        console.error('User not authenticated');
    }

}async function displayAllVendors(userRole, userEmail) {
    try {
        const vendorsSnapshot = await db.collection('vendors').get();
        const vendorGrid = document.getElementById('vendor-grid');
        vendorGrid.innerHTML = ''; // Clear previous vendors

        let vendors = [];

        vendorsSnapshot.forEach((doc) => {
            vendors.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Display initial chunk of vendors
        displayVendorsChunk(vendors.slice(0, 4), userRole, userEmail);

        // Show "View More" button if there are more vendors
        if (vendors.length > 4) {
            const viewMoreButton = document.createElement('button');
            viewMoreButton.textContent = 'View More';
            viewMoreButton.className = 'view-more';
            document.getElementById('vendor-grid').parentNode.appendChild(viewMoreButton);

            viewMoreButton.addEventListener('click', () => {
                const vendorIds = vendors.map(vendor => vendor.id);
                const targetUrl = `html/allVendorList.html?vendorIds=${encodeURIComponent(vendorIds.join(','))}`;
                window.location.href = targetUrl;
            });
        }

        document.getElementById('vendors').classList.remove('hidden');
    } catch (error) {
        console.error('Error displaying vendors:', error);
    }
}

// Example of redirecting to the new page with user information


function displayVendorsChunk(vendors, userRole, userEmail) {
    const vendorGrid = document.getElementById('vendor-grid');
    vendors.forEach((vendorData, index) => {
        const vendorCard = document.createElement('div');
        vendorCard.className = 'vendor-card';
        vendorCard.setAttribute('data-user-id', vendorData.email);

        vendorCard.innerHTML = `
            <img src="${vendorData.imageUrl}" alt="Vendor Image">
            <h3>${vendorData.name}</h3>
            <p>Address: ${vendorData.address}</p>
            <p>Mobile: ${vendorData.mobile}</p>
            <div class='edit-delete-container'>
                ${userRole === 'Admin' || (userRole === 'Vendor' && vendorData.email === userEmail) ? `<button class="delete-button">Delete</button>` : ''}
                ${userRole === 'Vendor' && vendorData.email === userEmail ? `<a href="#vendor-form-container" class="edit-button">Edit</a>` : ''}
               <button class="view-button" id="view-button">View Product</button>
                </div>
        `;

        vendorGrid.appendChild(vendorCard);

        const currentUserEmail = auth.currentUser ? auth.currentUser.email : '';

        const viewButton = vendorCard.querySelector('.view-button');
       // const currentUserEmail = auth.currentUser ? auth.currentUser.email : '';
        
        viewButton.addEventListener('click', () => {
            const targetUrl = `html/vendorProduct.html?vendorId=${encodeURIComponent(vendorData.userId)}&userEmail=${encodeURIComponent(currentUserEmail)}`;
            window.location.href = targetUrl;
        });
        const editButton = vendorCard.querySelector('.edit-button');
        if (editButton) {
            editButton.addEventListener('click', () => {
                document.getElementById('vendor-form-container').scrollIntoView({ behavior: 'auto' });
                handleEditVendor(vendorData);
            });
        }

        const delButton = vendorCard.querySelector('.delete-button');
        if (delButton) {
            delButton.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this vendor?')) {
                    await handleDeleteVendor(vendorData);
                }
            });
        }

        vendorCard.style.animationDelay = `${index * 0.5}s`;
    });
}


// Function to upload vendor image
async function uploadVendorImage(file, userEmail) {
    const storageRef = firebase.storage().ref();
    const vendorImageRef = storageRef.child(`vendors/${userEmail}/${file.name}`);

    try {
        // Check if there was an existing image and delete it
        const vendorDoc = await db.collection('vendors').doc(userEmail).get();
        const vendorData = vendorDoc.data();
        const oldImageUrl = vendorData?.imageUrl;

        if (oldImageUrl) {
            // Decode and clean the URL to extract the correct path
            const oldImagePath = decodeURIComponent(oldImageUrl.split('/o/')[1].split('?')[0]);
            console.log("Attempting to delete old image at path:", oldImagePath);

            const oldImageRef = storageRef.child(oldImagePath);

            try {
                // Check if the old image exists before attempting to delete
                await oldImageRef.getDownloadURL();
                console.log(`Old image at ${oldImagePath} exists, proceeding to delete`);

                await oldImageRef.delete();
                console.log(`Old image at ${oldImagePath} deleted successfully`);
            } catch (deleteError) {
                if (deleteError.code === 'storage/object-not-found') {
                    console.log(`Old image at ${oldImagePath} does not exist, skipping delete`);
                } else {
                    console.error('Error checking old image existence:', deleteError);
                }
            }
        }

        // Upload the new image
        await vendorImageRef.put(file);
        const newImageUrl = await vendorImageRef.getDownloadURL();
        console.log(`New image uploaded and accessible at ${newImageUrl}`);
        return newImageUrl;

    } catch (error) {
        console.error('Error uploading or deleting image:', error);
        throw error;
    }
}

// Function to get user role from Firestore
async function getUserRole(userId) {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    return userDoc.exists ? userDoc.data().role : 'User';
}

// Display selected image filename
const vendorImageInput = document.getElementById('vendor-image');
vendorImageInput.addEventListener('change', function () {
    const fileName = this.files[0]?.name || '';
    const fileNameDisplay = document.getElementById('vendor-file-name');
    fileNameDisplay.textContent = fileName ? `Selected file: ${fileName}` : 'No file chosen';
});

