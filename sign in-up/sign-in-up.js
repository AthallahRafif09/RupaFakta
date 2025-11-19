// Import Firebase modules
      import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
      import {
        getAuth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signInWithPopup,
        GoogleAuthProvider,
        sendPasswordResetEmail,
        updateProfile,
      } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

      // Firebase configuration
      // GANTI DENGAN KONFIGURASI FIREBASE ANDA
      const firebaseConfig = {
        apiKey: "AIzaSyAeXkARMkkwUjZMDLY-8kCIkJsqFEQm_zg",
        authDomain: "rupafakta-abf60.firebaseapp.com",
        projectId: "rupafakta-abf60",
        storageBucket: "rupafakta-abf60.firebasestorage.app",
        messagingSenderId: "618514059740",
        appId: "1:618514059740:web:747eeb8874a7aaeb3e3f19",
      };

      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const googleProvider = new GoogleAuthProvider();

      // DOM Elements
      const signInForm = document.getElementById("signInForm");
      const signUpForm = document.getElementById("signUpForm");
      const showSignUpBtn = document.getElementById("showSignUp");
      const showSignInBtn = document.getElementById("showSignIn");
      const errorMessage = document.getElementById("errorMessage");
      const successMessage = document.getElementById("successMessage");

      // Toggle between Sign In and Sign Up
      showSignUpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        signInForm.classList.add("hidden");
        signUpForm.classList.remove("hidden");
        hideMessages();
      });

      showSignInBtn.addEventListener("click", (e) => {
        e.preventDefault();
        signUpForm.classList.add("hidden");
        signInForm.classList.remove("hidden");
        hideMessages();
      });

      // Helper functions
      function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add("show");
        successMessage.classList.remove("show");
        setTimeout(() => {
          errorMessage.classList.remove("show");
        }, 5000);
      }

      function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add("show");
        errorMessage.classList.remove("show");
        setTimeout(() => {
          successMessage.classList.remove("show");
        }, 5000);
      }

      function hideMessages() {
        errorMessage.classList.remove("show");
        successMessage.classList.remove("show");
      }

      function getFirebaseErrorMessage(errorCode) {
        const errorMessages = {
          "auth/email-already-in-use":
            "Email sudah terdaftar. Silakan gunakan email lain atau masuk.",
          "auth/invalid-email": "Format email tidak valid.",
          "auth/operation-not-allowed":
            "Operasi tidak diizinkan. Hubungi administrator.",
          "auth/weak-password": "Password terlalu lemah. Minimal 6 karakter.",
          "auth/user-disabled": "Akun ini telah dinonaktifkan.",
          "auth/user-not-found":
            "Email tidak terdaftar. Silakan daftar terlebih dahulu.",
          "auth/wrong-password": "Password salah. Silakan coba lagi.",
          "auth/invalid-credential": "Email atau password salah.",
          "auth/too-many-requests":
            "Terlalu banyak percobaan. Coba lagi nanti.",
          "auth/network-request-failed":
            "Koneksi internet bermasalah. Periksa koneksi Anda.",
          "auth/popup-closed-by-user": "Popup ditutup. Silakan coba lagi.",
        };
        return (
          errorMessages[errorCode] || "Terjadi kesalahan. Silakan coba lagi."
        );
      }

      // Password strength checker
      const registerPassword = document.getElementById("registerPassword");
      const passwordStrength = document.getElementById("passwordStrength");

      registerPassword.addEventListener("input", (e) => {
        const password = e.target.value;
        if (password.length === 0) {
          passwordStrength.classList.remove("show");
          return;
        }

        passwordStrength.classList.add("show");
        let strength = "weak";

        if (password.length >= 8) {
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumbers = /\d/.test(password);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

          const criteriaCount = [
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar,
          ].filter(Boolean).length;

          if (criteriaCount >= 3) {
            strength = "strong";
          } else if (criteriaCount >= 2) {
            strength = "medium";
          }
        }

        passwordStrength.className =
          "password-strength show strength-" + strength;
        const strengthText = passwordStrength.querySelector(".strength-text");

        if (strength === "weak") {
          strengthText.textContent = "Password lemah";
        } else if (strength === "medium") {
          strengthText.textContent = "Password cukup kuat";
        } else {
          strengthText.textContent = "Password kuat";
        }
      });

      // Sign In with Email/Password
      const loginForm = document.getElementById("loginForm");
      const loginBtn = document.getElementById("loginBtn");

      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) {
          showError("Harap isi semua field.");
          return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "Memproses...";

        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          showSuccess("Berhasil masuk! Selamat datang kembali.");

          // Redirect after 1 second
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1000);
        } catch (error) {
          showError(getFirebaseErrorMessage(error.code));
          loginBtn.disabled = false;
          loginBtn.textContent = "Masuk";
        }
      });

      // Sign Up with Email/Password
      const registerForm = document.getElementById("registerForm");
      const registerBtn = document.getElementById("registerBtn");

      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById(
          "registerPasswordConfirm"
        ).value;

        if (!name || !email || !password || !confirmPassword) {
          showError("Harap isi semua field.");
          return;
        }

        if (password !== confirmPassword) {
          showError("Password dan konfirmasi password tidak cocok.");
          return;
        }

        if (password.length < 8) {
          showError("Password minimal 8 karakter.");
          return;
        }

        registerBtn.disabled = true;
        registerBtn.textContent = "Membuat Akun...";

        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

          // Update profile with display name
          await updateProfile(userCredential.user, {
            displayName: name,
          });

          showSuccess("Akun berhasil dibuat! Mengarahkan ke dashboard...");

          // Redirect after 1.5 seconds
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1500);
        } catch (error) {
          showError(getFirebaseErrorMessage(error.code));
          registerBtn.disabled = false;
          registerBtn.textContent = "Buat Akun";
        }
      });

      // Sign In with Google
      const googleLoginBtn = document.getElementById("googleLoginBtn");
      const googleSignUpBtn = document.getElementById("googleSignUpBtn");

      async function signInWithGoogle() {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          showSuccess("Berhasil masuk dengan Google! Mengarahkan...");

          setTimeout(() => {
            window.location.href = "/dashboard/dashboard.html";
          }, 1000);
        } catch (error) {
          if (error.code !== "auth/popup-closed-by-user") {
            showError(getFirebaseErrorMessage(error.code));
          }
        }
      }

      googleLoginBtn.addEventListener("click", signInWithGoogle);
      googleSignUpBtn.addEventListener("click", signInWithGoogle);

      // Forgot Password
      const forgotPasswordLink = document.getElementById("forgotPasswordLink");

      forgotPasswordLink.addEventListener("click", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();

        if (!email) {
          showError("Masukkan email Anda terlebih dahulu.");
          return;
        }

        try {
          await sendPasswordResetEmail(auth, email);
          showSuccess(
            "Email reset password telah dikirim. Periksa inbox Anda."
          );
        } catch (error) {
          showError(getFirebaseErrorMessage(error.code));
        }
      });

      // Check if user is already logged in
      auth.onAuthStateChanged((user) => {
        if (user && window.location.pathname.includes("auth.html")) {
          // User is signed in, redirect to dashboard
          window.location.href = "../dashboard/dashboard.html";
        }
      });
