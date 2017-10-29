module.exports = function transform(file, api, options) {
  const j = api.jscodeshift
  const root = j(file.source)

  const getFirstNode = () => root.find(j.Program).get('body', 0).node

  // Save first comments if they exist
  const firstNode = getFirstNode()
  const { comments } = firstNode

  const isUsed = local => {
    return (
      root
        .find(j.Identifier, {
          name: local,
        })
        .filter(p => {
          //console.log(p);
          return (
            p.parent.value.type !== 'ImportSpecifier' &&
            p.parent.value.type !== 'ImportDefaultSpecifier'
          )
        })
        .size() > 0
    )
  }

  root.find(j.ImportDeclaration).forEach(imp => {
    if (imp.node.specifiers == null) return
    let specsLeft = imp.node.specifiers.length

    imp.node.specifiers.forEach(spec => {
      const isDefault = j.ImportDefaultSpecifier.check(spec)
      const name = spec.local.name
      const used = isUsed(name)

      //if (isDefault === false && specifier.imported == null)
      //return console.log('Skipping default', name)

      console.log(name, 'used: ', used, 'isDefault', isDefault)
      //console.log(specifier);
      if (used === false) {
        specsLeft--
        removeImportByLocal(j, root, name)
      }
    })

    if (specsLeft === 0) imp.replace()
  })

  // Add the saved comments if the root node has changed
  const firstNode2 = getFirstNode()
  if (firstNode2 !== firstNode) {
    firstNode2.comments = comments
  }

  return root.toSource()
}

function removeImportByLocal(j, root, name) {
  console.log('removing', name)
  const r = root
    .find(j.ImportSpecifier, {
      local: {
        name: name,
      },
    })
    .remove()
}
