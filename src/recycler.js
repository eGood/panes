(function(exports){

   // Panes Recycler
   // the goal of this file is to create a recycler
   // that will instead of trying to animate a ton of
   // elements, to recycle a few elements and just 
   // replace and resize the content

  var PanesRecycler = function(els){
    this.els = els;
    this.panes = [];
  };

  PanesRecycler.prototype.getContent = function(){
    els.each(function(i){
      var ele = $(this);
      this.panes.push({
        content : ele.html(),
        classes : ele.attr("class")
      });
    });
  };

  exports.PanesRecycler = PanesRecycler;
  
}(this));