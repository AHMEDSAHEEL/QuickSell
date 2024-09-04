const firebaseConfig = {
    apiKey: "AIzaSyDRGzwePftO0o42hMGCQHx-K845Xjl4zEQ",
    authDomain: "quicksell-374b8.firebaseapp.com",
    projectId: "quicksell-374b8",
    storageBucket: "quicksell-374b8.appspot.com",
    messagingSenderId: "984641749083",
    appId: "1:984641749083:web:6fa3360232f0fc8fceff7e"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.getElementById('search-bar');
    const productGrid = document.getElementById('product-grid');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const caption = document.getElementById('caption');
    const close = document.querySelector('.close');

    auth.onAuthStateChanged(async (user) => {

    if (user) {
    //document.getElementById('user').style.display = 'block';
    const userDoc = await db.collection('users').doc(user.uid).get();
    const role = userDoc.data().role;
    console.log(role);
    console.log(user.uid);

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
    
}else {
            document.getElementById('sign-in').style.display = 'block';

            // Hide all delete buttons if not logged in
            document.querySelectorAll('.delete').forEach(button => {
                button.style.display = 'none';
            });
        }
    });


    // document.getElementById('user').addEventListener('click', () => {
    //     window.location.href = 'html/profile.html';
    // });


    async function renderAllProducts() {
        productGrid.innerHTML = ''; // Clear existing products

        const snapshot = await db.collection('products').get();
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            renderProductCard(product);
        });
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
<button class="buy" id="buy">Buy</button>
<button class="add" id="add">Add</button>  
 <button class="delete" id="delete" data-product-id="${id}" data-image-url="${imageFileUrl}">Delete</button> 
`;
        document.getElementById('product-grid').appendChild(newProductCard);

        // Image click event for the modal
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
                newProductCard.classList.add('fade-out');

                // Wait for the animation to complete before removing the card
                setTimeout(() => {
                    deleteProductFromFirestore(productId, imageUrl);
                    newProductCard.remove();
                }, 500);
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

        }

        // Update the timer immediately and then every second
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
        setTimeout(() => {
            newProductCard.style.opacity = 1;
            newProductCard.style.transform = 'translateX(0)';
        }, 400);
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


    function filterProducts() {
        const query = searchBar.value.toLowerCase();
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = name.includes(query) ? '' : 'none';
        });
    }

    searchBar.addEventListener('input', filterProducts);

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

    // Render all products on page load
    renderAllProducts();
});
