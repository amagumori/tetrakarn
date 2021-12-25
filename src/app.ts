const el = document.getElementById('drop-area') as HTMLElement

el.addEventListener( 'dragover', (event: DragEvent) => {
  event.stopPropagation()
  event.preventDefault()

  if ( event.dataTransfer ) 
    event.dataTransfer.dropEffect = 'copy'
})

el.addEventListener( 'drop', ( event: DragEvent ) => {
  event.stopPropagation()
  event.preventDefault()

  // can't you like wrap in a maybe type or something?
  if ( event.dataTransfer != null && event.dataTransfer != undefined ) { 
    const files: FileList = event.dataTransfer.files
    console.log(files) 
  }
})
