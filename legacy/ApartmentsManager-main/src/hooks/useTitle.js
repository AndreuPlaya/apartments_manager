import { useEffect } from "react"

const useTitle = (title) => {

    useEffect(() => {
        const prevTitle = document.title
        if (title!=='')
            document.title = `${process.env.REACT_APP_NAME}: ${title}`
        else
            document.title = process.env.REACT_APP_NAME

        return () => document.title = prevTitle
    }, [title])

}

export default useTitle