document.addEventListener('DOMContentLoaded', () => {
    // --- Add Address Modal ---
    const addAddressModal = document.getElementById('addAddressModal');
    const openAddModalBtn = document.querySelector('.add-address-card'); // The big "Add Address" card
    const headerAddBtn = document.querySelector('.profile-header .btn-secondary'); // The button in header
    const closeAddModalBtn = document.getElementById('closeAddModal');
    
    function openAddModal() {
        addAddressModal.classList.add('active');
    }
    
    function closeAddModal() {
        addAddressModal.classList.remove('active');
    }

    if(openAddModalBtn) openAddModalBtn.addEventListener('click', openAddModal);
    if(headerAddBtn) headerAddBtn.addEventListener('click', openAddModal);
    if(closeAddModalBtn) closeAddModalBtn.addEventListener('click', closeAddModal);

    // --- Edit Address Modal ---
    const editAddressModal = document.getElementById('editAddressModal');
    const closeEditModalBtn = document.getElementById('closeEditModal');
    // Selector logic handled in loop below to avoid :contains error


    function openEditModal() {
        editAddressModal.classList.add('active');
    }

    function closeEditModal() {
        editAddressModal.classList.remove('active');
    }

    document.querySelectorAll('.address-card .btn-link').forEach(btn => {
        if (btn.textContent.trim() === 'Edit') {
            btn.addEventListener('click', openEditModal);
        }
    });

    if(closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);

    // --- Delete Confirmation Modal ---
    const deleteModal = document.getElementById('deleteConfirmationModal');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    function openDeleteModal() {
        deleteModal.classList.add('active');
    }

    function closeDeleteModal() {
        deleteModal.classList.remove('active');
    }

    document.querySelectorAll('.address-card .btn-link.delete').forEach(btn => {
        btn.addEventListener('click', openDeleteModal);
    });

    if(closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    if(cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    
    if(confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            // Include actual delete logic here
            closeDeleteModal();
            alert('Address deleted (simulation)');
        });
    }


    // --- Set Default Confirmation Modal ---
    const defaultModal = document.getElementById('defaultConfirmationModal');
    const closeDefaultModalBtn = document.getElementById('closeDefaultModal');
    const cancelDefaultBtn = document.getElementById('cancelDefaultBtn');
    const confirmDefaultBtn = document.getElementById('confirmDefaultBtn');

    function openDefaultModal() {
        defaultModal.classList.add('active');
    }

    function closeDefaultModal() {
        defaultModal.classList.remove('active');
    }

    document.querySelectorAll('.address-card .btn-link').forEach(btn => {
        if (btn.textContent.trim() === 'Set as Default') {
            btn.addEventListener('click', openDefaultModal);
        }
    });

    if(closeDefaultModalBtn) closeDefaultModalBtn.addEventListener('click', closeDefaultModal);
    if(cancelDefaultBtn) cancelDefaultBtn.addEventListener('click', closeDefaultModal);

    if (confirmDefaultBtn) {
        confirmDefaultBtn.addEventListener('click', () => {
             // Include actual set default logic here
             closeDefaultModal();
             alert('Address set as default (simulation)');
        });
    }

    // --- Close modals when clicking outside ---
    window.addEventListener('click', (e) => {
        if (e.target === addAddressModal) closeAddModal();
        if (e.target === editAddressModal) closeEditModal();
        if (e.target === deleteModal) closeDeleteModal();
        if (e.target === defaultModal) closeDefaultModal();
    });

    // --- Handle Forms ---
    const addForm = document.getElementById('addAddressForm');
    if (addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            closeAddModal();
            alert('New address saved (simulation)');
        });
    }

    const editForm = document.getElementById('editAddressForm');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            closeEditModal();
            alert('Address updated (simulation)');
        });
    }
});
