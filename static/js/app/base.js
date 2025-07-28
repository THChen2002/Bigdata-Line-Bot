$(window).scroll(function () {
    if ($(this).scrollTop() > 50) {
        $(".navbar").addClass("shadow-lg navbar-shrink");
    } else {
        $(".navbar").removeClass("shadow-lg navbar-shrink");
    }
});