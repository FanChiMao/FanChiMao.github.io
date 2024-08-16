let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot_");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active_", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active_";
}

let slideIndex_2 = 1;
showSlides_2(slideIndex_2);

// Next/previous controls
function plusSlides_2(n) {
  showSlides_2(slideIndex_2 += n);
}

// Thumbnail image controls
function currentSlide_2(n) {
  showSlides_2(slideIndex_2 = n);
}

function showSlides_2(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides_2");
  let dots = document.getElementsByClassName("dot_2");
  if (n > slides.length) {slideIndex_2 = 1}
  if (n < 1) {slideIndex_2 = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active_", "");
  }
  slides[slideIndex_2-1].style.display = "block";
  dots[slideIndex_2-1].className += " active_";
}

let slideIndex_3 = 1;
showSlides_3(slideIndex_3);

// Next/previous controls
function plusSlides_3(n) {
  showSlides_3(slideIndex_3 += n);
}

// Thumbnail image controls
function currentSlide_3(n) {
  showSlides_3(slideIndex_3 = n);
}

function showSlides_3(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides_3");
  let dots = document.getElementsByClassName("dot_3");
  if (n > slides.length) {slideIndex_3 = 1}
  if (n < 1) {slideIndex_3 = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active_", "");
  }
  slides[slideIndex_3-1].style.display = "block";
  dots[slideIndex_3-1].className += " active_";
}


let slideIndex_4 = 1;
showSlides_4(slideIndex_4);

// Next/previous controls
function plusSlides_4(n) {
  showSlides_4(slideIndex_4 += n);
}

// Thumbnail image controls
function currentSlide_4(n) {
  showSlides_4(slideIndex_4 = n);
}

function showSlides_4(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides_4");
  let dots = document.getElementsByClassName("dot_4");
  if (n > slides.length) {slideIndex_4 = 1}
  if (n < 1) {slideIndex_4 = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active_", "");
  }
  slides[slideIndex_4-1].style.display = "block";
  dots[slideIndex_4-1].className += " active_";
}

let slideIndex_5 = 1;
showSlides_5(slideIndex_5);

// Next/previous controls
function plusSlides_5(n) {
  showSlides_5(slideIndex_5 += n);
}

// Thumbnail image controls
function currentSlide_5(n) {
  showSlides_5(slideIndex_5 = n);
}

function showSlides_5(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides_5");
  let dots = document.getElementsByClassName("dot_5");
  if (n > slides.length) {slideIndex_5 = 1}
  if (n < 1) {slideIndex_5 = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active_", "");
  }
  slides[slideIndex_5-1].style.display = "block";
  dots[slideIndex_5-1].className += " active_";
}
