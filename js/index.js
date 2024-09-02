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
                        else{
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
        newProductCard.querySelector('.delete').addEventListener('click', function() {
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

    function logAction(userId, actionType, resourceId,email) {
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
            logAction(auth.currentUser.uid, 'delete', productId,userDoc.data().email);
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

});
