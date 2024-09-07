// Initialize Firebase
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

let userID = '';
let userEmail = '';

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userID = user.uid;
            userEmail = user.email;
            console.log('User ID:', userID);
            console.log('User Email:', userEmail);

            try {
                const userRef = db.collection('users').doc(userID);
                const userDoc = await userRef.get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    document.getElementById('username').textContent = userData.username || 'User';
                    document.getElementById('user-mobile').textContent = userData.mobile || 'User';
                    document.getElementById('user-email').textContent = userData.email || 'User';
                    const profilePicture = document.getElementById('profile-picture');
                    
                    if (userData.profileImageUrl) {
                        profilePicture.src = userData.profileImageUrl;
                    } else {
                        profilePicture.src = '../images/userPofile.png'; // Default image path
                    }

                    // Display products when userID is set
                    if (userID) {
                        await displayProfileProducts(userID);
                    } else {
                        console.error('User ID is empty when attempting to display products');
                    }
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        } else {
            console.log('No user is signed in.');
            window.location.href = '../html/loginSignUp.html';
        }
    });

    document.getElementById('profile-picture-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profile-picture').src = e.target.result;
            };
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
            };
            reader.readAsDataURL(file);
        } else {
            console.log('No file selected.');
        }
    });

    document.getElementById('save-button').addEventListener('click', async () => {
        const fileInput = document.getElementById('profile-picture-input');
        const file = fileInput.files[0];
        const user = firebase.auth().currentUser;
        const loader = document.getElementById('loader');

        if (user && file) {
            const storageRef = firebase.storage().ref();
            const profilePicRef = storageRef.child(`profilePictures/${user.uid}/${file.name}`);

            loader.style.display = 'block';

            try {
                // Retrieve current user profile image URL
                const userRef = db.collection('users').doc(user.uid);
                const userDoc = await userRef.get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.profileImageUrl) {
                        const oldProfilePicRef = storage.refFromURL(userData.profileImageUrl);
                        try {
                            await oldProfilePicRef.delete(); // Delete the existing profile picture
                        } catch (deleteError) {
                            console.error('Error deleting old profile picture:', deleteError);
                        }
                    }
                }

                // Upload the new profile picture
                const snapshot = await profilePicRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();

                // Update Firestore with the new profile image URL
                await userRef.update({ profileImageUrl: downloadURL });

                // Update the profile picture on the page
                document.getElementById('profile-picture').src = downloadURL;
                alert('Profile picture updated successfully!');
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                alert('Error uploading profile picture.');
            } finally {
                loader.style.display = 'none';
            }
        } else {
            alert('No user signed in or no file selected.');
        }
    });

    // Function to display products in the user's profile
    async function displayProfileProducts(user_id) {
        const userId = user_id;
        console.log('Inside displayProfileProducts, User ID:', userId);

        if (!userId) {
            console.error('User ID is empty');
            return;
        }

        const profileProductsDiv = document.getElementById('profile-products');

        try {
            const profileProductsSnapshot = await db.collection('users').doc(userId).collection('profileProducts').get();
            profileProductsDiv.innerHTML = ''; // Clear existing products

            profileProductsSnapshot.forEach(doc => {
                const product = doc.data();
                const productCard = document.createElement('div');
                productCard.classList.add('product-card');
                productCard.innerHTML = `
                    <img src="${product.imageFileUrl}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>Price: ₹${product.price.toFixed(2)}</p>
                    <p>Expires in ${product.expiryDays} days</p>
                    <button class="delete" data-product-id="${doc.id}">Remove</button>
                `;
                profileProductsDiv.appendChild(productCard);
            });
        } catch (error) {
            console.error('Error fetching profile products:', error);
        }
    }

    // Function to remove a product card from the user's profile
    async function removeProductCard(productId, userID) {
        const userId = userID;
        try {
            // Remove the product document from Firestore
            await db.collection('users').doc(userId).collection('profileProducts').doc(productId).delete();
            console.log(`Product ${productId} removed from user ${userId}'s profile`);

            // Remove the product card from the UI
            const productCard = document.querySelector(`[data-product-id="${productId}"]`);
            if (productCard) {
                productCard.remove(); // Remove the product card from the DOM
            } else {
                console.error('Product card not found');
            }
        } catch (error) {
            console.error('Error removing product from profile:', error);
        }
    }

    // Event listener for delete buttons
    document.getElementById('profile-products').addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete')) {
            const productId = event.target.getAttribute('data-product-id');
            await removeProductCard(productId, userID);
            await displayProfileProducts(userID);
        }
    });

    // Logout button event listener
    document.getElementById('logout-button').addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = '../html/loginSignUp.html';
        } catch (error) {
            console.error('Error logging out:', error);
            alert('Error logging out.');
        }
    });
});
