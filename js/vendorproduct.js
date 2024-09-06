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
let userRole = '';

document.addEventListener('DOMContentLoaded', async function () {
//     auth.onAuthStateChanged(async (user) => {
//         if (user) {
//             // Fetch user role and then refresh the vendor list based on their role
//             userRole = await getUserRole(user.uid);
//             console.log(userRole);
//         }
//     else{
//         console.log("not user")
//     }});
            
    const params = new URLSearchParams(window.location.search);
    const vendorId = params.get('vendorId');
   const userEmail = params.get('userEmail');
 //  console.log(userRole)
    console.log("vendor's Id: "+vendorId +"email: "+userEmail)
    const vendorNameElement = document.getElementById('vendor-name');
    const productGrid = document.getElementById('product-grid');
    const noProductsMessage = document.getElementById('no-products-message');
   

    if (vendorId) {
        try {
            // Fetch vendor data using vendorId
            const vendorQuerySnapshot = await db.collection('vendors').where('userId', '==', vendorId).get();
            if (!vendorQuerySnapshot.empty) {
                const vendorDoc = vendorQuerySnapshot.docs[0];
                const vendorData = vendorDoc.data();
                vendorNameElement.textContent = `Products by ${vendorData.name}`;


               const userDoc = await db.collection('users').where('email', '==', userEmail).get();
               console.log(userEmail)
             
                if (!userDoc.empty) {
                    const roleDoc = userDoc.docs[0].data();
                    userRole = roleDoc.role;
                    console.log('User Role:', userRole);
                }
                else {
                    console.error('User not found in the database');
                }
            } else {
                console.error('Vendor not found');
                vendorNameElement.textContent = 'Vendor not found';
            }
            // Fetch products for this vendor
            const productsSnapshot = await db.collection('products').where('vendorId', '==', vendorId).get();
            if (productsSnapshot.empty) {
                noProductsMessage.textContent = "No Product to show"
                noProductsMessage.classList.remove('hidden');
            } else {
                noProductsMessage.classList.add('hidden');
                productsSnapshot.forEach(doc => {
                    const product = { id: doc.id, ...doc.data() };
                    renderProductCard(product);
                });
            }

        } catch (error) {
            console.error('Error fetching vendor or products:', error);
        }
    } else {
        console.error('No vendor ID provided');
        vendorNameElement.textContent = 'Invalid Vendor ID';
    }

    function renderProductCard(product) {
        const { id, name, price, expiryDays, imageFileUrl, timestamp, user_id, email } = product;
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
          ${(userRole === 'Admin' || (userRole === 'Vendor' && email===userEmail)) ? `<button class="delete" id="delete" data-product-id="${id}" data-image-url="${imageFileUrl}">Delete</button>` : ''}
        `;
        document.getElementById('product-grid').appendChild(newProductCard);

        // Image click event for the modal
        newProductCard.querySelector('img').addEventListener('click', () => {
            modal.style.display = "block";
            modalImg.src = imageFileUrl;
            caption.textContent = name;
        });

        const deleteButton = newProductCard.querySelector('.delete');
        if (deleteButton) {
            deleteButton.addEventListener('click', function () {
                const productId = this.getAttribute('data-product-id');
                const imageUrl = this.getAttribute('data-image-url');
                const confirmDelete = confirm("Are you sure you want to delete this product?");

                if (confirmDelete) {
                    newProductCard.classList.add('fade-out');


                    setTimeout(() => {
                        deleteProductFromFirestore(productId, imageUrl);
                        newProductCard.remove();
                    }, 500);
                }
            });
        }

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
                clearInterval(timerInterval);
                newProductCard.remove();
            }
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
    // async function getUserRole(uid) {
    //     try {
    //         const userDoc = await db.collection('users').doc(uid).get();
    //         if (userDoc.exists) {
    //             return userDoc.data().role;
    //         }
    //         return null;
    //     } catch (error) {
    //         console.error('Error getting user role:', error);
    //         return null;
    //     }
    // }
});
