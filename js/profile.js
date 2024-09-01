document.addEventListener('DOMContentLoaded', async () => {
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

    // Check user authentication state
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                document.getElementById('username').textContent = userData.username || 'User';
                const profilePicture = document.getElementById('profile-picture');
                if (userData.profileImageUrl) {
                    profilePicture.src = userData.profileImageUrl;
                } else {
                    profilePicture.src = 'default-profile.png'; // Default image
                }
            } else {
                console.log('No such document!');
            }
        } else {
            console.log('No user is signed in.');
            // Redirect to login/signup page if no user is signed in
            window.location.href = '../html/loginSignUp.html';
        }
    });

    // Handle profile picture preview
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

    // Handle profile picture upload
    document.getElementById('save-button').addEventListener('click', async () => {
        const fileInput = document.getElementById('profile-picture-input');
        const file = fileInput.files[0];
        const user = firebase.auth().currentUser;
        const loader = document.getElementById('loader');

        if (user && file) {
            const storageRef = firebase.storage().ref();
            const profilePicRef = storageRef.child(`profilePictures/${user.uid}/${file.name}`);

            // Show loader
            loader.style.display = 'block';

            try {
                // Upload the file to Firebase Storage
                const snapshot = await profilePicRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();

                // Update Firestore with the new profile image URL
                await db.collection('users').doc(user.uid).update({
                    profileImageUrl: downloadURL
                });

                // Update the profile picture on the page
                document.getElementById('profile-picture').src = downloadURL;
                alert('Profile picture updated successfully!');
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                alert('Error uploading profile picture.');
            } finally {
                // Hide loader
                loader.style.display = 'none';
            }
        } else {
            alert('No user signed in or no file selected.');
        }
    });

    // Handle logout
    document.getElementById('logout-button').addEventListener('click', async () => {
        try {
            await auth.signOut();
            // Redirect to login/signup page
            window.location.href = 'html/loginSignUp.html';
        } catch (error) {
            console.error('Error logging out:', error);
            alert('Error logging out.');
        }
    });
});
