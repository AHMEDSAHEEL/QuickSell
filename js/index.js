document.addEventListener('DOMContentLoaded', function() {
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
    
    
    //document.getElementById('userPofile').style.display='none';
    document.getElementById('sign-in').style.display='none';
    document.getElementById('user').style.display='none';
    
    auth.onAuthStateChanged(async (user) => {
       
        if (user) {
            document.getElementById('user').style.display='block';
            const userDoc = await db.collection('users').doc(user.uid).get();
            const isAdmin = userDoc.data().isAdmin;
            console.log()
            //  document.getElementById('username').textContent = `Welcome, ${userDoc.data().username}`;
            
          
            if (isAdmin) {
                
                document.getElementById('admin-panel').style.display='block';
            } else {
                document.getElementById('admin-panel').style.display='none';
            }
        } 
        else{
            document.getElementById('sign-in').style.display='block';
        }
    });

    document.getElementById('user').addEventListener('click', () => {
        window.location.href = '../html/profile.html';
    });
    
    
    
    document.getElementById('product-image').addEventListener('change', function() {
        
        const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
        document.getElementById('file-name').textContent = fileName;
    });
    

    const buttons = document.querySelectorAll('#hero button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
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
        const newImageRef = storageRef.child(`images/${file.name}`);

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
        const productRef = db.collection('products').doc(productId);
        const productDoc = await productRef.get();
        const productData = productDoc.data();

        const imageUrl = await uploadImage(imageFile, productData ? productData.imageFileUrl : null);

        const updatedProductData = {
            name,
            price,
            expiryDays,
            imageFileUrl: imageUrl || '../images/product.png',
            timestamp: Date.now() // Store the current timestamp
        };

        return productRef.set(updatedProductData, { merge: true });
    }

    function renderProductCard(product) {
        const { id, name, price, expiryDays, imageFileUrl, timestamp } = product;
        const newProductCard = document.createElement('div');
        newProductCard.classList.add('product-card');
        newProductCard.setAttribute('data-product-id', id);
    
        newProductCard.innerHTML = `
            <img src="${imageFileUrl}" alt="${name}">
            <h3>${name}</h3>
            <p>Price: $${price.toFixed(2)}</p>
            <p class="expiry-timer">Expires in ${expiryDays} days</p>
            <button class="buy" id="buy">buy</button>
            <button class="add" id="add">Add</button>  
        `;
        document.getElementById('product-grid').appendChild(newProductCard);
    
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
                }, 1000000);
            }
        }
    
        // Update the timer immediately and then every second
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    
    async function deleteProductFromFirestore(productId, imageFileUrl) {
        const productRef = db.collection('products').doc(productId);
    
        try {
            // Delete product document
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

        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            renderProductCard(product);
        });
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

    productForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        document.getElementById('spinner').style.display='block';
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
            document.getElementById('spinner').style.display='none';
            alert('Product updated/added successfully');
            productForm.reset();
            document.getElementById('file-name').textContent = 'No file chosen';
        } catch (error) {
            document.getElementById('spinner').style.display='none';
            console.error('Error updating product:', error);
        }
    });
});
