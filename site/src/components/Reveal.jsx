import useReveal from '../hooks/useReveal.js'

export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const [ref, isVisible] = useReveal()
  const classes = ['reveal-wrap', className, isVisible ? 'is-visible' : ''].filter(Boolean).join(' ')

  return (
    <Tag ref={ref} data-reveal className={classes} {...rest}>
      {children}
    </Tag>
  )
}
