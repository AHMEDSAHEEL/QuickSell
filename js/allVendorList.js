// Firebase configuration
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
let userRole =''
let userEmail=''
// Display all vendors when the page loads
document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.getElementById('search-bar');
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userEmail=user.email;
            console.log(userEmail)
            // Fetch user role and then refresh the vendor list based on their role
             userRole = await getUserRole(user.uid);
            await refreshVendorListAndForm(userRole, userEmail);
        } else {
            // Redirect to login page if not signed in
            window.location.href = 'html/loginSignUp.html';
        }
    });
    searchBar.addEventListener('input', filterProducts);
function filterProducts() {
    const query = searchBar.value.toLowerCase();
    const vendorsCards = document.querySelectorAll('.vendor-card');

    vendorsCards.forEach(card => {
        const name = card.querySelector('h2').textContent.toLowerCase();
        card.style.display = name.includes(query) ? '' : 'none';
    });
}

});

// Function to refresh the vendor list and display form based on the user's role
async function refreshVendorListAndForm(userRole, userEmail) {
    try {
        if (['Vendor', 'Admin', 'User'].includes(userRole)) {
            document.getElementById('vendors').style.display = 'block'; // Display the vendors section
            await displayAllVendors(userRole, userEmail);
        } else {
            console.error('User role not recognized');
        }
    } catch (error) {
        console.error('Error refreshing vendor list:', error);
    }
}
//const currentUserEmail = auth.currentUser ? auth.currentUser.email : '';
//console.log(currentUserEmail)

// Function to display all vendors dynamically
async function displayAllVendors(userRole, userEmail) {
    console.log(userRole, userEmail);
    try {
        const vendorsSnapshot = await db.collection('vendors').get();
        const vendorGrid = document.getElementById('vendor-grid');
        vendorGrid.innerHTML = ''; // Clear previous vendors

        vendorsSnapshot.forEach((doc) => {
            const vendorData = doc.data();
            const vendorCard = document.createElement('div');
            vendorCard.className = 'vendor-card';
            vendorCard.dataset.userId = vendorData.email;

            // Create vendor card content
            vendorCard.innerHTML = `
                <div class="vendor-info">
                    <img src="${vendorData.imageUrl}" alt="Vendor Image" class="vendor-image">
                    <h2>${vendorData.name}</h2>
                    <p>${vendorData.address}</p>
                    <p>${vendorData.mobile}</p>
                </div>
                <div class="button-group"></div>
            `;

            const buttonGroup = vendorCard.querySelector('.button-group');

            // Add buttons based on the user's role
            if (userRole === 'Admin') {
                createAdminButtons(buttonGroup, vendorData.email,vendorData.userId);
            } else if (userRole === 'Vendor') {
                createVendorButtons(buttonGroup, vendorData.email,vendorData.userId);
            } else if (userRole === 'User') {
                createUserButton(buttonGroup,vendorData.userId);
            }

            // Append the card to the vendor grid
            vendorGrid.appendChild(vendorCard);

            // Handle redirection to vendor's product page on card click
            vendorCard.addEventListener('click', () => {
                
            });
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
    }
}



// Function to create buttons for Admin role
function createAdminButtons(buttonGroup, vendorEmail,vendorId) {
    const viewButton = document.createElement('button');
    viewButton.textContent = 'View Products';
    viewButton.classList.add('view-button');
    viewButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const targetUrl = `../html/vendorProduct.html?vendorId=${encodeURIComponent(vendorId)}&userEmail=${encodeURIComponent(userEmail)}`;
                window.location.href = targetUrl;
    });

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.classList.add('edit-button');
    editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        editVendor(vendorEmail);
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-button');
    deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteVendor(vendorEmail); // Call the deleteVendor function
    });

    buttonGroup.appendChild(viewButton);
    buttonGroup.appendChild(editButton);
    buttonGroup.appendChild(deleteButton);
}

//Function to create buttons for Vendor role (for their own vendor entry)
function createVendorButtons(buttonGroup,vendorEmail, vendorId) {
    
    const viewButton = document.createElement('button');
    viewButton.textContent = 'View Products';
    viewButton.classList.add('view-button');
    viewButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const targetUrl = `../html/vendorProduct.html?vendorId=${encodeURIComponent(vendorId)}&userEmail=${encodeURIComponent(userEmail)}`;
                window.location.href = targetUrl;
    });
    console.log(userEmail+"  "+vendorEmail)
    
    if(userEmail===vendorEmail){
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.classList.add('edit-button');
    editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        editVendor(vendorEmail);
       
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-button');
    deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteVendor(vendorEmail); // Call the deleteVendor function
        
    });
 buttonGroup.appendChild(editButton);
buttonGroup.appendChild(deleteButton);
    }
    buttonGroup.appendChild(viewButton);
   
   
}

// Function to create a button for User role
function createUserButton(buttonGroup) {
    const viewButton = document.createElement('button');
    viewButton.textContent = 'View Products';
    viewButton.classList.add('view-button');
    viewButton.addEventListener('click', (event) => {
        event.stopPropagation();

        viewButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const targetUrl = `../html/vendorProduct.html?vendorId=${encodeURIComponent(vendorId)}&userEmail=${encodeURIComponent(userEmail)}`;
                    window.location.href = targetUrl;
        });
        // Redirect logic for User role can be added here if needed
    });

    buttonGroup.appendChild(viewButton);
}

// Function to delete vendor
async function deleteVendor(vendorId) {
    try {
        // Confirm the deletion
        if (confirm('Are you sure you want to delete this vendor?')) {
            // Get current user
            const user = auth.currentUser;
            if (user) {
                const userRole = await getUserRole(user.uid);
                await deleteVendorFromFirestore(vendorId); // Pass the vendorId which is the email

                // Refresh the vendor list after deletion
                await refreshVendorListAndForm(userRole, user.email);
            } else {
                console.error('No user is currently authenticated.');
            }
        }
    } catch (error) {
        console.error('Error deleting vendor:', error);
    }
}

// Function to edit vendor details
function editVendor(vendorId) {
    const editDialog = document.getElementById('edit-dialog');
    const editOverlay = document.getElementById('edit-overlay');
    const vendorImageInput = document.getElementById('edit-vendor-image');
    let newImageFile = null;

    if (!editDialog || !editOverlay) {
        console.error('Edit dialog or overlay not found in DOM');
        return;
    }

    editDialog.style.display = 'block';
    editOverlay.style.display = 'block';

    // Fetch vendor data and populate the form
    db.collection('vendors').doc(vendorId).get().then(doc => {
        if (doc.exists) {
            const vendorData = doc.data();
            document.getElementById('edit-vendor-name').value = vendorData.name;
            document.getElementById('edit-vendor-address').value = vendorData.address;
            document.getElementById('edit-vendor-mobile').value = vendorData.mobile;
            document.getElementById('vendor-file-name').textContent = vendorData.imageUrl ? 'Current Image Selected' : 'No Image Selected';
        }
    });

    vendorImageInput.addEventListener('change', function () {
        const file = this.files[0];
        const fileNameDisplay = document.getElementById('vendor-file-name');
        fileNameDisplay.textContent = file ? `Selected file: ${file.name}` : 'No file chosen';
        newImageFile = file;
    });

    document.getElementById('save-edit').onclick = async function () {
        const updatedName = document.getElementById('edit-vendor-name').value;
        const updatedAddress = document.getElementById('edit-vendor-address').value;
        const updatedMobile = document.getElementById('edit-vendor-mobile').value;
        let newImageUrl = null;

        if (newImageFile) {
            newImageUrl = await uploadVendorImage(newImageFile, vendorId);
        }

        const updateData = {
            name: updatedName,
            address: updatedAddress,
            mobile: updatedMobile
        };

        if (newImageUrl) {
            updateData.imageUrl = newImageUrl;
        }

        await db.collection('vendors').doc(vendorId).update(updateData);
        editDialog.style.display = 'none';
        editOverlay.style.display = 'none';
        await refreshVendorListAndForm(userRole, userEmail); // Refresh the list after updating
    };

    document.getElementById('cancel-edit').onclick = function () {
        editDialog.style.display = 'none';
        editOverlay.style.display = 'none';
    };
}

// Function to upload vendor image
async function uploadVendorImage(file, vendorId) {
    try {
        const storageRef = storage.ref(`vendor-images/${vendorId}/${file.name}`);
        await storageRef.put(file);
        const downloadURL = await storageRef.getDownloadURL();
        return downloadURL;
    } catch (error) {
        console.error('Error uploading vendor image:', error);
        return null;
    }
}

// Function to delete vendor from Firestore
async function deleteVendorFromFirestore(vendorId) {
    try {
        await db.collection('vendors').doc(vendorId).delete();
        console.log('Vendor deleted successfully');
    } catch (error) {
        console.error('Error deleting vendor from Firestore:', error);
    }
}

// Function to get user role
async function getUserRole(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            return userDoc.data().role;
        } else {
            console.error('User role not found');
            return null;
        }
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
}
