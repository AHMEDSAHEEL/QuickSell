

document.addEventListener('DOMContentLoaded', function () {



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

    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const caption = document.getElementById('caption');
    const close = document.querySelector('.close');

    //document.getElementById('userPofile').style.display='none';
    document.getElementById('sign-in').style.display = 'none';
    document.getElementById('user').style.display = 'none';
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            document.getElementById('user').style.display = 'block';
            const userDoc = await db.collection('users').doc(user.uid).get();
            const role = userDoc.data().role;
            console.log(role);
            console.log(user.uid);
            document.getElementById('admin-panel').style.display = (role === 'Admin' || role === 'Vendor') ? 'block' : 'none';

            //  Update visibility of delete buttons
            if (role === 'Admin') {
                // Admins can delete any product
                console.log(1);
                document.querySelectorAll('.delete').forEach(button => {
                    button.style.display = 'inline-block';
                });
            }

            if (role === 'Vendor') {
                console.log(role);

                try {
                    const productsSnapshot = await db.collection('products').where('vendorId', '==', user.uid).get();
                    console.log('Query executed');

                    if (productsSnapshot.empty) {
                        console.log('No matching products.');
                        return;
                    }

                    productsSnapshot.forEach(doc => {
                        console.log('Product found:', doc.id);
                        const deleteButton = document.querySelector(`[data-product-id="${doc.id}"] .delete`);
                        console.log(deleteButton)
                        if (deleteButton) {
                            deleteButton.style.display = 'inline-block';
                        }
                        else {
                            console.log('not')
                        }
                        // document.querySelectorAll('.products').forEach(card => {
                        //     const vendorId = card.getAttribute('data-vendor-id'); // Assuming each product card has this attribute
                        //     console.log(vendorId)
                        //     if (user.uid !== vendorId && role !== 'Admin') {
                        //         card.querySelector('.delete').style.display = 'none';
                        //     }
                        // });
                    });
                } catch (error) {
                    console.error('Error fetching products:', error);
                }
            }



            // Hide delete buttons for other vendors' products


        } else {
            document.getElementById('sign-in').style.display = 'block';

            // Hide all delete buttons if not logged in
            document.querySelectorAll('.delete').forEach(button => {
                button.style.display = 'none';
            });
        }

        // Helper function to check if the user is an admin (not currently used but kept for future use)
        // async function isAdmin(userId) {
        //     const userDoc = await db.collection('users').doc(userId).get();
        //     return userDoc.data().role === 'Admin';
        // }

    });



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
        const newImageRef = storageRef.child(`images/${uniqueFileName}`);

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


    function renderProductCard(product) {
        const { id, name, price, expiryDays, imageFileUrl, timestamp } = product;
        const newProductCard = document.createElement('div');
        newProductCard.classList.add('product-card');
        newProductCard.setAttribute('data-product-id', id);

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

        // Listen for changes (e.g., product deletion) and update button accordingly
        // You should call `updateViewMoreButton()` after any operation that changes the number of products


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
                        }, index * 100); // Stagger animation by 100ms
                    });
                }
            });
        }, { threshold: 0.1 });
        productsObserver.observe(products);

    });

    const productForm = document.getElementById('product-form');

    productForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        document.getElementById('spinner').style.display = 'block';
        const productId = document.getElementById('product-id').value.trim();
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
    // Close modal when user clicks on close button
    close.addEventListener('click', () => {
        modal.style.display = "none";
    });

    // Close modal when user clicks outside of the image
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

// Authentication state listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userRole = await getUserRole(user.uid);
        const vendorRef = db.collection('vendors').doc(user.email);
        const vendorDoc = await vendorRef.get();
        const h2 = document.getElementById('h2-vendorList');
        h2.style.display = 'none';

        if (vendorDoc.exists) {
            // Vendor exists, hide form and display vendor list
            h2.style.display = 'block';
            document.getElementById('vendor-form-container').style.display = 'none';
            document.getElementById('vendors').style.display = 'block';
            displayAllVendors(userRole, user.email);
        } else if (userRole === 'Vendor' && !vendorDoc.exists) {
            // Vendor info doesn't exist, show form to add vendor
            document.getElementById('vendor-form-container').style.display = 'block';
            document.getElementById('vendors').style.display = 'block';
            h2.style.display = 'none';

            document.getElementById('vendor-form').addEventListener('submit', async function (e) {
                e.preventDefault();
                document.getElementById('vendor-spinner').style.display = 'block';

                const name = document.getElementById('vendor-name').value.trim();
                const address = document.getElementById('shop-address').value.trim();
                const mobile = document.getElementById('mobile-number').value.trim();
                const imageFile = document.getElementById('vendor-image').files[0];

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
                    displayAllVendors(await getUserRole(auth.currentUser.uid), userEmail);
                    document.getElementById('vendor-form-container').style.display = 'none';
                    alert('Successfully added vendor');
                } catch (error) {
                    console.error('Error saving vendor information:', error);
                } finally {
                    document.getElementById('vendor-spinner').style.display = 'none';
                }
            });
        } else {
            // User is an Admin or another role; show vendor list only
            document.getElementById('vendor-form-container').style.display = 'none';
            document.getElementById('vendors').style.display = 'block';
            h2.style.display = 'none';
            displayAllVendors(userRole, user.email);
        }
    } else {
        // Redirect to login if not signed in
        window.location.href = 'html/loginSignUp.html';
    }
});

// Function to display all vendors based on role
function displayAllVendors(userRole, userEmail) {
    db.collection('vendors').get().then((vendorsSnapshot) => {
        const vendorGrid = document.getElementById('vendor-grid');
        vendorGrid.innerHTML = ''; // Clear previous vendors

        let index = 0; // To keep track of the delay for each card
        vendorsSnapshot.forEach((doc) => {
            const vendorData = doc.data();
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
                    ${userRole === 'Vendor' && vendorData.email === userEmail ? `<button class="edit-button">Edit</button>` : ''}
                </div>
            `;

            vendorGrid.appendChild(vendorCard);

            // Handle edit button functionality
            const editButton = vendorCard.querySelector('.edit-button');
            if (editButton) {
                editButton.addEventListener('click', () => handleEditVendor(vendorData));
            }

            // Handle delete button functionality
            const delButton = vendorCard.querySelector('.delete-button');
            if (delButton) {
                delButton.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete this vendor?')) {
                        await handleDeleteVendor(vendorData);
                    }
                });
            }

            vendorCard.style.animationDelay = `${index * 0.8}s`;
            index++;
        });

        document.getElementById('vendors').classList.remove('hidden');
    });
}

// Handle vendor edit functionality
async function handleEditVendor(vendorData) {
    db.collection('vendors').doc(vendorData.email).get().then((vendorDoc) => {
        const vendorData = vendorDoc.data();
        document.getElementById('edit-AddvendorH1').textContent = "Edit Vendor";
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
async function refreshVendorListAndForm() {
    const user = auth.currentUser;

    if (user) {
        const userRole = await getUserRole(user.uid);
        const vendorRef = db.collection('vendors').doc(user.email);
        const vendorDoc = await vendorRef.get();

        if (userRole === 'Vendor' && !vendorDoc.exists) {
            // Vendor info doesn't exist, show form to add vendor
            document.getElementById('vendor-form-container').style.display = 'block';
            document.getElementById('vendors').style.display = 'block';
        } else {
            // Vendor info exists or user is an Admin; show vendor list only
            document.getElementById('vendor-form-container').style.display = 'none';
            document.getElementById('vendors').style.display = 'block';
        }

        // Reload the vendor list
        displayAllVendors(userRole, user.email);
    }
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
});